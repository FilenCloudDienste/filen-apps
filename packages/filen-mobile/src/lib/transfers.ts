import auth from "@/lib/auth"
import { run } from "@filen/utils"
import * as FileSystem from "expo-file-system"
import {
	type Dir,
	type File,
	DirEnum,
	DirEnum_Tags,
	type FileWithPath,
	type DirWithPath,
	FilenSdkError,
	NonRootItemTagged
} from "@filen/sdk-rs"
import useTransfersStore from "@/stores/useTransfers.store"
import { normalizeFilePathForSdk, unwrapDirMeta, unwrapFileMeta } from "@/lib/utils"
import { driveItemsQueryUpdate } from "@/queries/useDriveItems.query"

function createCompositeAbortSignal(...signals: AbortSignal[]): AbortSignal {
	const controller = new AbortController()

	for (const signal of signals) {
		if (signal.aborted) {
			controller.abort()

			return controller.signal
		}

		signal.addEventListener("abort", () => controller.abort(), {
			once: true
		})
	}

	return controller.signal
}

class Transfers {
	private globalAbortController = new AbortController()

	public cancelAll(): void {
		this.globalAbortController.abort()
		this.globalAbortController = new AbortController()
	}

	public pauseAll(): void {
		// TODO: Implement PauseController
	}

	public resumeAll(): void {
		// TODO: Implement PauseController
	}

	public async upload({
		id,
		localFileOrDir,
		parent
	}: {
		id: string
		localFileOrDir: FileSystem.File | FileSystem.Directory
		parent: Dir
	}): Promise<{
		files: File[]
		directories: Dir[]
	}> {
		const currentTransfers = useTransfersStore.getState().transfers.filter(t => !t.finishedAt)

		if (
			currentTransfers.find(t => t.id === id) ||
			currentTransfers.find(
				t => (t.type === "uploadDirectory" || t.type === "uploadFile") && t.localFileOrDir.uri === localFileOrDir.uri
			)
		) {
			throw new Error("A transfer with the same ID or local URI is already in progress.")
		}

		const sdkClient = await auth.getSdkClient()
		const transferAbortController = new AbortController()
		// TODO: Implement PauseController
		const compositeAbortSignal = createCompositeAbortSignal(this.globalAbortController.signal, transferAbortController.signal)

		if (localFileOrDir instanceof FileSystem.File) {
			if (!localFileOrDir.exists || !localFileOrDir.size) {
				throw new Error("Local file does not exist or is empty.")
			}

			useTransfersStore.getState().setTransfers(prev =>
				prev.concat({
					id,
					localFileOrDir,
					parent,
					type: "uploadFile",
					size: localFileOrDir.size,
					bytesTransferred: 0,
					startedAt: Date.now(),
					abortController: transferAbortController,
					errors: {
						unknown: [],
						scan: [],
						upload: []
					},
					abort: () => {
						if (transferAbortController.signal.aborted) {
							return
						}

						transferAbortController.abort()
					},
					pause: () => {
						// TODO: Implement PauseController
					},
					resume: () => {
						// TODO: Implement PauseController
					}
				})
			)
		} else {
			if (!localFileOrDir.exists) {
				throw new Error("Local directory does not exist or is empty.")
			}

			useTransfersStore.getState().setTransfers(prev =>
				prev.concat({
					id,
					localFileOrDir,
					parent,
					type: "uploadDirectory",
					size: 0,
					knownDirectories: 0,
					knownFiles: 0,
					bytesTransferred: 0,
					startedAt: Date.now(),
					abortController: transferAbortController,
					errors: {
						unknown: [],
						scan: [],
						upload: []
					},
					abort: () => {
						if (transferAbortController.signal.aborted) {
							return
						}

						transferAbortController.abort()
					},
					pause: () => {
						// TODO: Implement PauseController
					},
					resume: () => {
						// TODO: Implement PauseController
					}
				})
			)
		}

		if (localFileOrDir instanceof FileSystem.Directory) {
			const result = await run(async defer => {
				defer(() => {
					useTransfersStore.getState().setTransfers(prev =>
						prev.map(t =>
							t.id === id
								? {
										...t,
										finishedAt: Date.now(),
										lastProgressAt: Date.now()
									}
								: t
						)
					)
				})

				const transferred: {
					files: File[]
					directories: Dir[]
				} = {
					files: [],
					directories: []
				}

				await sdkClient.uploadDirRecursively(
					normalizeFilePathForSdk(localFileOrDir.uri),
					{
						onScanComplete(totalDirs, totalFiles, totalBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === id && t.type === "uploadDirectory"
										? {
												...t,
												size: Number(totalBytes),
												knownDirectories: Number(totalDirs),
												knownFiles: Number(totalFiles),
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onScanErrors(errors) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === id && t.type === "uploadDirectory"
										? {
												...t,
												errors: {
													...t.errors,
													scan: t.errors.scan.concat(errors)
												},
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onScanProgress(knownDirs, knownFiles, knownBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === id && t.type === "uploadDirectory"
										? {
												...t,
												size: Number(knownBytes),
												knownDirectories: Number(knownDirs),
												knownFiles: Number(knownFiles),
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onUploadErrors(errors) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === id && t.type === "uploadDirectory"
										? {
												...t,
												errors: {
													...t.errors,
													upload: t.errors.upload.concat(errors)
												},
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onUploadUpdate(uploadedDirs, uploadedFiles, uploadedBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === id
										? {
												...t,
												bytesTransferred: t.bytesTransferred + Number(uploadedBytes),
												lastProgressAt: Date.now(),
												lastProgressBytesTransferredAt: Date.now()
											}
										: t
								)
							)

							for (const uploadedDir of uploadedDirs) {
								transferred.directories.push(uploadedDir)

								const { meta, dir, shared } = unwrapDirMeta(uploadedDir)

								if (!shared) {
									driveItemsQueryUpdate({
										params: {
											path: {
												type: "drive",
												uuid: parent.uuid
											}
										},
										updater: prev =>
											prev
												.filter(item => item.data.uuid !== uploadedDir.uuid)
												.concat([
													{
														type: "directory",
														data: {
															...dir,
															size: 0n,
															decryptedMeta: meta
														}
													}
												])
									})
								}
							}

							for (const uploadedFile of uploadedFiles) {
								transferred.files.push(uploadedFile)

								const { meta, shared, file } = unwrapFileMeta(uploadedFile)

								if (!shared) {
									driveItemsQueryUpdate({
										params: {
											path: {
												type: "drive",
												uuid: parent.uuid
											}
										},
										updater: prev =>
											prev
												.filter(item => item.data.uuid !== uploadedFile.uuid)
												.concat([
													{
														type: "file",
														data: {
															...file,
															decryptedMeta: meta
														}
													}
												])
									})
								}
							}
						}
					},
					parent,
					{
						signal: compositeAbortSignal
					}
				)

				return transferred
			})

			if (!result.success) {
				useTransfersStore.getState().setTransfers(prev =>
					prev.map(t =>
						t.id === id && t.type === "uploadDirectory"
							? {
									...t,
									errors: {
										...t.errors,
										...(FilenSdkError.hasInner(result.error)
											? {
													upload: t.errors.upload.concat([
														{
															error: FilenSdkError.getInner(result.error),
															path: localFileOrDir.uri
														}
													])
												}
											: {
													unknown: t.errors.unknown.concat([
														result.error instanceof Error ? result.error : new Error(String(result.error))
													])
												})
									},
									lastProgressAt: Date.now()
								}
							: t
					)
				)

				throw result.error
			}

			return result.data
		}

		// TODO: Add metadata timestamps to uploadFile SDK method as soon as they are supported
		const result = await run(async defer => {
			defer(() => {
				useTransfersStore.getState().setTransfers(prev =>
					prev.map(t =>
						t.id === id
							? {
									...t,
									finishedAt: Date.now(),
									lastProgressAt: Date.now()
								}
							: t
					)
				)
			})

			return await sdkClient.uploadFile(
				parent,
				normalizeFilePathForSdk(localFileOrDir.uri),
				{
					onUpdate(uploadedBytes) {
						useTransfersStore.getState().setTransfers(prev =>
							prev.map(t =>
								t.id === id
									? {
											...t,
											bytesTransferred: t.bytesTransferred + Number(uploadedBytes),
											lastProgressAt: Date.now(),
											lastProgressBytesTransferredAt: Date.now()
										}
									: t
							)
						)
					}
				},
				{
					signal: compositeAbortSignal
				}
			)
		})

		if (!result.success) {
			useTransfersStore.getState().setTransfers(prev =>
				prev.map(t =>
					t.id === id && t.type === "uploadFile"
						? {
								...t,
								errors: {
									...t.errors,
									...(FilenSdkError.hasInner(result.error)
										? {
												upload: t.errors.upload.concat([
													{
														error: FilenSdkError.getInner(result.error),
														path: localFileOrDir.uri
													}
												])
											}
										: {
												unknown: t.errors.unknown.concat([
													result.error instanceof Error ? result.error : new Error(String(result.error))
												])
											})
								},
								lastProgressAt: Date.now()
							}
						: t
				)
			)

			throw result.error
		}

		const { meta, shared, file } = unwrapFileMeta(result.data)

		if (!shared) {
			driveItemsQueryUpdate({
				params: {
					path: {
						type: "drive",
						uuid: parent.uuid
					}
				},
				updater: prev =>
					prev
						.filter(item => item.data.uuid !== result.data.uuid)
						.concat([
							{
								type: "file",
								data: {
									...file,
									decryptedMeta: meta
								}
							}
						])
			})
		}

		return {
			files: [result.data],
			directories: []
		}
	}

	public async download({
		itemUuid,
		item,
		destination
	}: {
		itemUuid: string
		item: DirEnum | File
		destination: FileSystem.File | FileSystem.Directory
	}): Promise<{
		files: FileWithPath[]
		directories: DirWithPath[]
	}> {
		const currentTransfers = useTransfersStore
			.getState()
			.transfers.filter(t => !t.finishedAt && (t.type === "downloadFile" || t.type === "downloadDirectory"))

		if (currentTransfers.find(t => t.id === itemUuid)) {
			throw new Error("Already downloading an item with the same ID.")
		}

		const sdkClient = await auth.getSdkClient()
		const transferAbortController = new AbortController()
		// TODO: Implement PauseController
		const compositeAbortSignal = createCompositeAbortSignal(this.globalAbortController.signal, transferAbortController.signal)

		if (!DirEnum.instanceOf(item)) {
			if (!(destination instanceof FileSystem.File)) {
				throw new Error("Destination must be a file for file downloads.")
			}

			useTransfersStore.getState().setTransfers(prev =>
				prev.concat({
					id: itemUuid,
					item,
					type: "downloadFile",
					size: Number(item.size),
					bytesTransferred: 0,
					startedAt: Date.now(),
					abortController: transferAbortController,
					errors: {
						unknown: [],
						scan: [],
						download: []
					},
					destination,
					abort: () => {
						if (transferAbortController.signal.aborted) {
							return
						}

						transferAbortController.abort()
					},
					pause: () => {
						// TODO: Implement PauseController
					},
					resume: () => {
						// TODO: Implement PauseController
					}
				})
			)
		} else {
			if (destination instanceof FileSystem.File) {
				throw new Error("Destination must be a directory for directory downloads.")
			}

			useTransfersStore.getState().setTransfers(prev =>
				prev.concat({
					id: itemUuid,
					item,
					type: "downloadDirectory",
					size: 0,
					knownDirectories: 0,
					knownFiles: 0,
					bytesTransferred: 0,
					startedAt: Date.now(),
					abortController: transferAbortController,
					directoryQueryProgress: {
						totalBytes: 0,
						bytesTransferred: 0
					},
					errors: {
						unknown: [],
						scan: [],
						download: []
					},
					destination,
					abort: () => {
						if (transferAbortController.signal.aborted) {
							return
						}

						transferAbortController.abort()
					},
					pause: () => {
						// TODO: Implement PauseController
					},
					resume: () => {
						// TODO: Implement PauseController
					}
				})
			)
		}

		if (destination.exists) {
			throw new Error("Destination already exists.")
		}

		if (DirEnum.instanceOf(item)) {
			const result = await run(async defer => {
				defer(() => {
					useTransfersStore.getState().setTransfers(prev =>
						prev.map(t =>
							t.id === itemUuid
								? {
										...t,
										finishedAt: Date.now(),
										lastProgressAt: Date.now()
									}
								: t
						)
					)
				})

				// TODO: Once sdk supports downloading shared/public dirs, add proper NonRootItemTagged/DirEnum_Tags here
				if (item.tag !== DirEnum_Tags.Dir) {
					throw new Error("Invalid directory item.")
				}

				const transferred: {
					files: FileWithPath[]
					directories: DirWithPath[]
				} = {
					files: [],
					directories: []
				}

				await sdkClient.downloadDirRecursively(
					normalizeFilePathForSdk(destination.uri),
					{
						onDownloadErrors(errors) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid && t.type === "downloadDirectory"
										? {
												...t,
												errors: {
													...t.errors,
													download: t.errors.download.concat(errors)
												},
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onDownloadUpdate(downloadedDirs, downloadedFiles, downloadedBytes) {
							for (const downloadedDir of downloadedDirs) {
								transferred.directories.push(downloadedDir)
							}

							for (const downloadedFile of downloadedFiles) {
								transferred.files.push(downloadedFile)
							}

							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid
										? {
												...t,
												bytesTransferred: t.bytesTransferred + Number(downloadedBytes),
												lastProgressAt: Date.now(),
												lastProgressBytesTransferredAt: Date.now()
											}
										: t
								)
							)
						},
						onQueryDownloadProgress(knownBytes, totalBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid && t.type === "downloadDirectory"
										? {
												...t,
												directoryQueryProgress: {
													bytesTransferred: Number(knownBytes),
													totalBytes: Number(totalBytes)
												},
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onScanComplete(totalDirs, totalFiles, totalBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid && t.type === "downloadDirectory"
										? {
												...t,
												size: Number(totalBytes),
												knownDirectories: Number(totalDirs),
												knownFiles: Number(totalFiles),
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onScanErrors(errors) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid && t.type === "downloadDirectory"
										? {
												...t,
												errors: {
													...t.errors,
													scan: t.errors.scan.concat(errors)
												},
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						},
						onScanProgress(knownDirs, knownFiles, knownBytes) {
							useTransfersStore.getState().setTransfers(prev =>
								prev.map(t =>
									t.id === itemUuid && t.type === "downloadDirectory"
										? {
												...t,
												size: Number(knownBytes),
												knownDirectories: Number(knownDirs),
												knownFiles: Number(knownFiles),
												lastProgressAt: Date.now()
											}
										: t
								)
							)
						}
					},
					item,
					{
						signal: compositeAbortSignal
					}
				)

				return transferred
			})

			if (!result.success) {
				useTransfersStore.getState().setTransfers(prev =>
					prev.map(t =>
						t.id === itemUuid && t.type === "downloadDirectory"
							? {
									...t,
									errors: {
										...t.errors,
										// TODO: Once sdk supports downloading shared/public dirs, add proper NonRootItemTagged/DirEnum_Tags here
										...(FilenSdkError.hasInner(result.error) && item.tag === DirEnum_Tags.Dir
											? {
													download: t.errors.download.concat([
														{
															path: destination.uri,
															error: FilenSdkError.getInner(result.error),
															item: new NonRootItemTagged.Dir(item.inner[0])
														}
													])
												}
											: {
													unknown: t.errors.unknown.concat([
														result.error instanceof Error ? result.error : new Error(String(result.error))
													])
												})
									},
									lastProgressAt: Date.now()
								}
							: t
					)
				)

				throw result.error
			}

			return result.data
		}

		const result = await run(async defer => {
			defer(() => {
				useTransfersStore.getState().setTransfers(prev =>
					prev.map(t =>
						t.id === itemUuid
							? {
									...t,
									finishedAt: Date.now(),
									lastProgressAt: Date.now()
								}
							: t
					)
				)
			})

			await sdkClient.downloadFile(
				item,
				normalizeFilePathForSdk(destination.uri),
				{
					onUpdate(uploadedBytes) {
						useTransfersStore.getState().setTransfers(prev =>
							prev.map(t =>
								t.id === itemUuid
									? {
											...t,
											bytesTransferred: t.bytesTransferred + Number(uploadedBytes),
											lastProgressAt: Date.now(),
											lastProgressBytesTransferredAt: Date.now()
										}
									: t
							)
						)
					}
				},
				{
					signal: compositeAbortSignal
				}
			)

			return {
				files: [
					{
						path: destination.uri,
						file: item
					}
				],
				directories: []
			}
		})

		if (!result.success) {
			useTransfersStore.getState().setTransfers(prev =>
				prev.map(t =>
					t.id === itemUuid && t.type === "downloadFile"
						? {
								...t,
								errors: {
									...t.errors,
									...(FilenSdkError.hasInner(result.error)
										? {
												download: t.errors.download.concat([
													{
														path: destination.uri,
														error: FilenSdkError.getInner(result.error),
														item: new NonRootItemTagged.File(item)
													}
												])
											}
										: {
												unknown: t.errors.unknown.concat([
													result.error instanceof Error ? result.error : new Error(String(result.error))
												])
											})
								},
								lastProgressAt: Date.now()
							}
						: t
				)
			)

			throw result.error
		}

		return result.data
	}
}

const transfers = new Transfers()

export default transfers
