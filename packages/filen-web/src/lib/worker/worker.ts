import {
	login as filenSdkRsLogin,
	type StringifiedClient as FilenSdkRsStringifiedClient,
	fromStringified as filenSdkRsFromStringified,
	type Client as FilenSdkRsClient,
	type File as FilenSdkRsFile,
	type Item as FilenSdkRsItem
} from "@filen/sdk-rs"
import { transfer as comlinkTransfer } from "comlink"
import { extractTransferables } from "./utils"
import path from "path"

export type FilenSdkRsClientFunctions = Omit<
	{
		[K in keyof FilenSdkRsClient]: (...args: Parameters<FilenSdkRsClient[K]>) => ReturnType<FilenSdkRsClient[K]>
	},
	"free" | "uploadFileFromReader" | "downloadFileToWriter" | "downloadFile" | "uploadFile" | "toStringified" | "downloadItemsToZip"
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

let filenSdkRsClient: FilenSdkRsClient | null = null
let messageHandlerForMainThread: ((message: WorkerToMainMessage) => void) | null = null

export async function setMessageHandler(handler: (message: WorkerToMainMessage) => void): Promise<void> {
	messageHandlerForMainThread = handler
}

export async function getClient(): Promise<FilenSdkRsClient | null> {
	return filenSdkRsClient
}

export async function stringifyClient(): Promise<FilenSdkRsStringifiedClient | null> {
	if (!filenSdkRsClient) {
		return null
	}

	return filenSdkRsClient.toStringified()
}

export async function setClient(stringifiedClient: FilenSdkRsStringifiedClient): Promise<FilenSdkRsClient> {
	filenSdkRsClient = filenSdkRsFromStringified(stringifiedClient)

	return filenSdkRsClient
}

export async function login(...params: Parameters<typeof filenSdkRsLogin>): Promise<FilenSdkRsClient> {
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
	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	return await filenSdkRsClient.uploadFileFromReader({
		name: params.file.name,
		known_size: BigInt(params.file.size),
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
	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	const file = await params.fileHandle.getFile()

	return await filenSdkRsClient.uploadFileFromReader({
		...params,
		name: file.name,
		known_size: BigInt(file.size),
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

export async function downloadItemsToZip({ items, id }: { items: FilenSdkRsItem[]; id: string }): Promise<FileSystemFileHandle> {
	if (!filenSdkRsClient) {
		throw new Error("Client is not set.")
	}

	const opfsFileName = `${self.crypto.randomUUID()}.zip`
	const opfsRoot = await self.navigator.storage.getDirectory()
	const fileHandle = await opfsRoot.getFileHandle(opfsFileName, {
		create: true
	})
	const writer = await fileHandle.createWritable()

	await filenSdkRsClient.downloadItemsToZip({
		items,
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

export async function callSdkFunction<T extends keyof FilenSdkRsClientFunctions>(functionNameAndParams: {
	functionName: T
	params: Parameters<FilenSdkRsClientFunctions[T]>
}): Promise<Awaited<ReturnType<FilenSdkRsClientFunctions[T]>>> {
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
