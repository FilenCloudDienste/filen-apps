import initFilenSdkRs, {
	login as filenSdkRsLogin,
	type StringifiedClient as FilenSdkRsStringifiedClient,
	fromStringified as filenSdkRsFromStringified,
	type Client as FilenSdkRsClient,
	type File as FilenSdkRsFile,
	type Item as FilenSdkRsItem,
	type DirEnum as FilenSdkRsDirEnum
} from "@filen/sdk-rs"
import { transfer as comlinkTransfer } from "comlink"
import { extractTransferables } from "./utils"
import path from "path"
import Semaphore from "../semaphore"

export type FilenSdkRsClientFunctions = Omit<
	{
		[K in keyof FilenSdkRsClient]: (...args: Parameters<FilenSdkRsClient[K]>) => ReturnType<FilenSdkRsClient[K]>
	},
	"free"
>

export type WorkerToMainMessage =
	| {
			type: "uploadProgress"
			data: {
				id: string
				bytes: number
			}
	  }
	| {
			type: "downloadProgress"
			data: {
				id: string
				bytes: number
			}
	  }
	| {
			type: "compressProgress"
			data: {
				type: "upload" | "download"
				id: string
				bytes: number
			}
	  }

let filenSdkRsClient: FilenSdkRsClient | null = null
let messageHandlerForMainThread: ((message: WorkerToMainMessage) => void) | null = null
let filenSdkRsWasmInitialized: boolean = false
const initMutex: Semaphore = new Semaphore(1)

export async function waitForFilenSdkRsWasmInit(): Promise<void> {
	await initMutex.acquire()

	try {
		while (!filenSdkRsWasmInitialized) {
			await initFilenSdkRs()

			filenSdkRsWasmInitialized = true
		}
	} finally {
		initMutex.release()
	}
}

export async function setMessageHandler(handler: (message: WorkerToMainMessage) => void): Promise<void> {
	messageHandlerForMainThread = handler
}

export async function getClient(): Promise<FilenSdkRsClient | null> {
	await waitForFilenSdkRsWasmInit()

	return filenSdkRsClient
}

export async function stringifyClient(): Promise<FilenSdkRsStringifiedClient | null> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		return null
	}

	return filenSdkRsClient.toStringified()
}

export async function setClient(stringifiedClient: FilenSdkRsStringifiedClient): Promise<FilenSdkRsClient> {
	await waitForFilenSdkRsWasmInit()

	filenSdkRsClient = filenSdkRsFromStringified({
		...stringifiedClient,
		maxIoMemoryUsage: 1024 * 1024 * 64,
		maxParallelRequests: 128
	})

	return filenSdkRsClient
}

export async function login(...params: Parameters<typeof filenSdkRsLogin>): Promise<FilenSdkRsClient> {
	await waitForFilenSdkRsWasmInit()

	filenSdkRsClient = await filenSdkRsLogin(...params)

	return filenSdkRsClient
}

export async function uploadFileStreamFile(
	params: Omit<
		Parameters<FilenSdkRsClient["uploadFileFromReader"]>[0],
		"reader" | "progress" | "name" | "known_size" | "abort_signal"
	> & {
		file: File
		id: string
	}
): ReturnType<FilenSdkRsClient["uploadFileFromReader"]> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	return await filenSdkRsClient.uploadFileFromReader({
		name: params.file.name,
		knownSize: BigInt(params.file.size),
		parent: params.parent,
		reader: params.file.stream(),
		progress(bytes) {
			messageHandlerForMainThread?.({
				type: "uploadProgress",
				data: {
					id: params.id,
					bytes: Number(bytes)
				}
			})
		}
	})
}

export async function uploadFileStreamFileHandle(
	params: Omit<
		Parameters<FilenSdkRsClient["uploadFileFromReader"]>[0],
		"reader" | "name" | "known_size" | "progress" | "abort_signal"
	> & {
		fileHandle: FileSystemFileHandle
		id: string
	}
): ReturnType<FilenSdkRsClient["uploadFileFromReader"]> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	const file = await params.fileHandle.getFile()

	return await filenSdkRsClient.uploadFileFromReader({
		...params,
		name: file.name,
		knownSize: BigInt(file.size),
		reader: file.stream(),
		progress(bytes) {
			messageHandlerForMainThread?.({
				type: "uploadProgress",
				data: {
					id: params.id,
					bytes: Number(bytes)
				}
			})
		}
	})
}

export async function downloadFile({ file, id }: { file: FilenSdkRsFile; id: string }): Promise<FileSystemFileHandle> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	if (!file.meta) {
		throw new Error("File metadata is not available.")
	}

	const opfsFileName = `${self.crypto.randomUUID()}${path.posix.extname(file.meta.name)}`
	const opfsRoot = await self.navigator.storage.getDirectory()
	const fileHandle = await opfsRoot.getFileHandle(opfsFileName, {
		create: true
	})
	const writer = await fileHandle.createWritable()

	await filenSdkRsClient.downloadFileToWriter({
		file,
		writer,
		progress(bytes) {
			messageHandlerForMainThread?.({
				type: "downloadProgress",
				data: {
					id,
					bytes: Number(bytes)
				}
			})
		}
	})

	return fileHandle
}

export async function compressItems({
	items,
	id,
	parent,
	name
}: {
	items: FilenSdkRsItem[]
	id: string
	parent: FilenSdkRsDirEnum
	name: string
}): Promise<FilenSdkRsFile> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	const opfsFileName = `${self.crypto.randomUUID()}.zip`
	const opfsRoot = await self.navigator.storage.getDirectory()

	try {
		const fileHandle = await opfsRoot.getFileHandle(opfsFileName, {
			create: true
		})
		const writer = await fileHandle.createWritable()

		await filenSdkRsClient.downloadItemsToZip({
			items,
			writer,
			progress(bytes) {
				messageHandlerForMainThread?.({
					type: "compressProgress",
					data: {
						type: "download",
						id,
						bytes: Number(bytes)
					}
				})
			}
		})

		const file = await fileHandle.getFile()
		const reader = file.stream()

		return await filenSdkRsClient.uploadFileFromReader({
			reader,
			parent,
			name,
			knownSize: BigInt(file.size),
			progress(bytes) {
				messageHandlerForMainThread?.({
					type: "compressProgress",
					data: {
						type: "upload",
						id,
						bytes: Number(bytes)
					}
				})
			}
		})
	} finally {
		await opfsRoot.removeEntry(opfsFileName).catch(() => {})
	}
}

export async function callSdkFunction<T extends keyof FilenSdkRsClientFunctions>(functionNameAndParams: {
	functionName: T
	params: Parameters<FilenSdkRsClientFunctions[T]>
}): Promise<Awaited<ReturnType<FilenSdkRsClientFunctions[T]>>> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	const { functionName, params } = functionNameAndParams
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const fn = (filenSdkRsClient as any)[functionName]

	if (typeof fn !== "function") {
		throw new Error(`Method ${String(functionName)} is not a function.`)
	}

	const result = await fn.apply(filenSdkRsClient, params)
	const resultTransferables = extractTransferables(result)

	if (resultTransferables.length > 0) {
		return comlinkTransfer(result, resultTransferables)
	}

	return result
}
