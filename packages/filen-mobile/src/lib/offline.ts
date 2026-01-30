import * as FileSystem from "expo-file-system"
import { Platform } from "react-native"
import { IOS_APP_GROUP_IDENTIFIER } from "@/constants"
import type { DriveItem } from "@/types"
import { run, Semaphore } from "@filen/utils"
import transfers from "@/lib/transfers"
import { pack, unpack } from "msgpackr"
import auth from "@/lib/auth"
import { AnyDirEnum, NonRootItemTagged_Tags, type AnyDirEnumWithShareInfo, AnyDirEnumWithShareInfo_Tags, type File } from "@filen/sdk-rs"
import { unwrapFileMeta } from "@/lib/utils"

export type OfflineFileMeta = {
	file: DriveItem
	parent: AnyDirEnumWithShareInfo
}

class Offline {
	private readonly directory: FileSystem.Directory = new FileSystem.Directory(
		Platform.select({
			ios: FileSystem.Paths.join(
				FileSystem.Paths.appleSharedContainers?.[IOS_APP_GROUP_IDENTIFIER]?.uri ?? FileSystem.Paths.document.uri,
				"offline"
			),
			default: FileSystem.Paths.join(FileSystem.Paths.document.uri, "offline")
		})
	)
	private readonly filesDirectory: FileSystem.Directory = new FileSystem.Directory(FileSystem.Paths.join(this.directory.uri, "files"))
	private readonly directoriesDirectory: FileSystem.Directory = new FileSystem.Directory(
		FileSystem.Paths.join(this.directory.uri, "directories")
	)
	private readonly refetchFilesInBackgroundMutex = new Semaphore(1)
	private readonly refetchedFiles: Record<string, boolean> = {}

	public constructor() {
		this.ensureDirectories()
	}

	private ensureDirectories(): void {
		if (!this.directory.exists) {
			this.directory.create({
				intermediates: true,
				idempotent: true
			})
		}

		if (!this.filesDirectory.exists) {
			this.filesDirectory.create({
				intermediates: true,
				idempotent: true
			})
		}

		if (!this.directoriesDirectory.exists) {
			this.directoriesDirectory.create({
				intermediates: true,
				idempotent: true
			})
		}
	}

	public async refetchFilesInBackground(files: { file: File; parent: AnyDirEnumWithShareInfo }[]): Promise<void> {
		const storedFiles: {
			dataFile: FileSystem.File
			metaFile: FileSystem.File
			file: DriveItem
			parent: AnyDirEnumWithShareInfo
		}[] = []

		const result = await run(async defer => {
			await this.refetchFilesInBackgroundMutex.acquire()

			defer(() => {
				this.refetchFilesInBackgroundMutex.release()
			})

			await Promise.all(
				files
					// Make sure we refetch a file only once. Currently relying on UUIDs being unique, will change in v4 though.
					.filter(({ file }) => !this.refetchedFiles[file.uuid])
					.map(async ({ file, parent }) => {
						const { meta, shared, file: unwrappedFile } = unwrapFileMeta(file)

						if (shared) {
							return
						}

						const driveItem: DriveItem = {
							type: "file",
							data: {
								...unwrappedFile,
								decryptedMeta: meta
							}
						}

						storedFiles.push(
							await this.storeFile({
								file: driveItem,
								parent
							})
						)

						this.refetchedFiles[file.uuid] = true
					})
			)
		})

		if (!result.success) {
			console.error(result.error)

			return
		}

		if (storedFiles.length === 0) {
			return
		}

		// TODO: Update any UI or state if necessary (query cache, etc.)
	}

	public async listFiles(): Promise<
		{
			dataFile: FileSystem.File
			metaFile: FileSystem.File
			file: DriveItem
			parent: AnyDirEnumWithShareInfo
		}[]
	> {
		this.ensureDirectories()

		const sdkClient = await auth.getSdkClient()
		const entries = this.filesDirectory.list()
		const files: {
			dataFile: FileSystem.File
			metaFile: FileSystem.File
			file: DriveItem
			parent: AnyDirEnumWithShareInfo
		}[] = []
		const needsRefetch: {
			file: File
			parent: AnyDirEnumWithShareInfo
		}[] = []

		await Promise.all(
			entries.map(async entry => {
				if (!(entry instanceof FileSystem.Directory)) {
					if (entry.exists) {
						entry.delete()
					}

					return
				}

				const innerEntries = entry.list()

				await Promise.all(
					innerEntries.map(async innerEntry => {
						if (!(innerEntry instanceof FileSystem.File)) {
							if (innerEntry.exists) {
								innerEntry.delete()
							}

							return
						}

						if (innerEntry.name === "meta") {
							return
						}

						const dataFile = innerEntry
						const metaFile = new FileSystem.File(FileSystem.Paths.join(dataFile.parentDirectory.uri, "meta"))

						if (!dataFile.exists || !metaFile.exists) {
							if (entry.exists) {
								entry.delete()
							}

							return
						}

						const meta: OfflineFileMeta = unpack(await metaFile.bytes())

						if (meta.file.type !== "file") {
							if (entry.exists) {
								entry.delete()
							}

							return
						}

						const findItemInDirResult = await run(async () => {
							if (meta.file.type !== "file") {
								throw new Error("Item not of type file")
							}

							if (!meta.file.data.decryptedMeta) {
								throw new Error("File missing decrypted meta")
							}

							if (meta.parent.tag === AnyDirEnumWithShareInfo_Tags.SharedDir) {
								throw new Error("Offline parent cannot be a shared directory")
							}

							const parent =
								meta.parent.tag === AnyDirEnumWithShareInfo_Tags.Dir
									? new AnyDirEnum.Dir(meta.parent.inner[0])
									: new AnyDirEnum.Root(meta.parent.inner[0])

							return await sdkClient.findItemInDir(parent, meta.file.data.decryptedMeta.name)
						})

						if (
							findItemInDirResult.success &&
							findItemInDirResult.data &&
							findItemInDirResult.data.tag === NonRootItemTagged_Tags.File &&
							findItemInDirResult.data.inner[0].uuid !== meta.file.data.uuid
						) {
							if (entry.exists) {
								entry.delete()
							}

							needsRefetch.push({
								file: findItemInDirResult.data.inner[0],
								parent: meta.parent
							})

							return
						}

						files.push({
							dataFile,
							metaFile,
							file: meta.file,
							parent: meta.parent
						})
					})
				)
			})
		)

		if (needsRefetch.length > 0) {
			this.refetchFilesInBackground(needsRefetch).catch(console.error)
		}

		return files
	}

	public isFileStored(file: DriveItem): boolean {
		if (file.type !== "file" || !file.data.decryptedMeta) {
			return false
		}

		const dataFile = new FileSystem.File(FileSystem.Paths.join(this.filesDirectory.uri, file.data.uuid, file.data.decryptedMeta.name))
		const metaFile = new FileSystem.File(FileSystem.Paths.join(this.filesDirectory.uri, file.data.uuid, "meta"))

		return dataFile.parentDirectory.exists && dataFile.exists && metaFile.exists
	}

	public async storeFile({ file, parent }: { file: DriveItem; parent: AnyDirEnumWithShareInfo }): Promise<{
		dataFile: FileSystem.File
		metaFile: FileSystem.File
		file: DriveItem
		parent: AnyDirEnumWithShareInfo
	}> {
		if (file.type !== "file") {
			throw new Error("Item not of type file")
		}

		if (!file.data.decryptedMeta) {
			throw new Error("File missing decrypted meta")
		}

		this.ensureDirectories()

		const dataFile = new FileSystem.File(FileSystem.Paths.join(this.filesDirectory.uri, file.data.uuid, file.data.decryptedMeta.name))
		const metaFile = new FileSystem.File(FileSystem.Paths.join(this.filesDirectory.uri, file.data.uuid, "meta"))

		if (dataFile.parentDirectory.exists) {
			dataFile.parentDirectory.delete()
		}

		dataFile.parentDirectory.create({
			intermediates: true,
			idempotent: true
		})

		const result = await run(async () => {
			await transfers.download({
				item: file,
				destination: dataFile,
				itemUuid: file.data.uuid
			})

			metaFile.write(
				new Uint8Array(
					pack({
						file,
						parent
					} satisfies OfflineFileMeta)
				)
			)
		})

		if (!result.success) {
			if (dataFile.parentDirectory.exists) {
				dataFile.parentDirectory.delete()
			}

			throw result.error
		}

		return {
			dataFile,
			metaFile,
			file,
			parent
		}
	}
}

const offline = new Offline()

export default offline
