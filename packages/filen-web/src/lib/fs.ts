import pathModule from "path"

export class Fs {
	private rootHandle: FileSystemDirectoryHandle | null = null
	private initDone: boolean = false

	public async init(): Promise<void> {
		const directory = await globalThis.navigator.storage.getDirectory()

		const rootHandle = await directory.getDirectoryHandle("fs", {
			create: true
		})

		this.rootHandle = rootHandle
		this.initDone = true
	}

	private async waitForInit(): Promise<void> {
		while (!this.initDone) {
			await this.init()
		}
	}

	public async ensurePath(path: string): Promise<FileSystemDirectoryHandle> {
		await this.waitForInit()

		if (!this.rootHandle) {
			throw new Error("FileSystem not initialized.")
		}

		const parsed = pathModule.posix.parse(path)

		if (parsed.dir.length === 0 || parsed.dir === "/") {
			return this.rootHandle
		}

		let currentDir = this.rootHandle

		for (const dirName of parsed.dir.split("/")) {
			if (dirName.length === 0) {
				continue
			}

			currentDir = await currentDir.getDirectoryHandle(dirName, {
				create: true
			})
		}

		return currentDir
	}

	public async mkdir(path: string): Promise<FileSystemDirectoryHandle> {
		await this.waitForInit()

		if (!this.rootHandle) {
			throw new Error("FileSystem not initialized.")
		}

		const parent = await this.ensurePath(path)
		const dirHandle = await parent.getDirectoryHandle(path, {
			create: true
		})

		return dirHandle
	}

	public async readFile(path: string): Promise<Buffer> {
		await this.waitForInit()

		if (!this.rootHandle) {
			throw new Error("FileSystem not initialized.")
		}

		const parent = await this.ensurePath(path)

		const fileHandle = await parent.getFileHandle(path)
		const file = await fileHandle.getFile()

		return Buffer.from(await file.arrayBuffer())
	}

	public async readFileStream(path: string): Promise<ReadableStream<Uint8Array>> {
		await this.waitForInit()

		if (!this.rootHandle) {
			throw new Error("FileSystem not initialized.")
		}

		const parent = await this.ensurePath(path)

		const fileHandle = await parent.getFileHandle(path)
		const file = await fileHandle.getFile()

		return file.stream()
	}

	public async writeFile(path: string, data: Buffer): Promise<void> {
		await this.waitForInit()

		if (!this.rootHandle) {
			throw new Error("FileSystem not initialized.")
		}

		const parent = await this.ensurePath(path)

		const fileHandle = await parent.getFileHandle(path, {
			create: true
		})

		const writable = await fileHandle.createWritable()

		await writable.write(new Uint8Array(data))
		await writable.close()
	}
}

export const fs = new Fs()

export default fs
