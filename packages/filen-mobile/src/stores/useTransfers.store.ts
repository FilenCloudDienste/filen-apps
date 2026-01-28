import { create } from "zustand"
import * as FileSystem from "expo-file-system"
import type {
	Dir,
	FilenSdkErrorInterface,
	UploadError,
	DownloadError,
	File,
	AnyDirEnumWithShareInfo,
	NonRootItemTagged
} from "@filen/sdk-rs"

export type Transfer = {
	id: string
	size: number
	bytesTransferred: number
	startedAt: number
	lastProgressAt?: number
	lastProgressBytesTransferredAt?: number
	finishedAt?: number
	abortController: AbortController
	abort: () => void
	pause: () => void
	resume: () => void
} & (
	| {
			type: "uploadDirectory"
			knownFiles: number
			knownDirectories: number
			errors: {
				upload: UploadError[]
				scan: FilenSdkErrorInterface[]
				unknown: Error[]
			}
			localFileOrDir: FileSystem.File | FileSystem.Directory
			parent: Dir
	  }
	| {
			type: "uploadFile"
			errors: {
				upload: UploadError[]
				scan: FilenSdkErrorInterface[]
				unknown: Error[]
			}
			localFileOrDir: FileSystem.File | FileSystem.Directory
			parent: Dir
	  }
	| {
			type: "downloadFile"
			errors: {
				download: (Omit<DownloadError, "item"> & {
					item?: NonRootItemTagged
				})[]
				scan: FilenSdkErrorInterface[]
				unknown: Error[]
			}
			item: File
			destination: FileSystem.File
	  }
	| {
			type: "downloadDirectory"
			knownFiles: number
			knownDirectories: number
			directoryQueryProgress: {
				bytesTransferred: number
				totalBytes: number
			}
			errors: {
				download: (Omit<DownloadError, "item"> & {
					item?: NonRootItemTagged
				})[]
				scan: FilenSdkErrorInterface[]
				unknown: Error[]
			}
			item: AnyDirEnumWithShareInfo
			destination: FileSystem.Directory
	  }
)

export type Transfers = {
	transfers: Transfer[]
	setTransfers: (fn: Transfer[] | ((prev: Transfer[]) => Transfer[])) => void
}

export const useTransfersStore = create<Transfers>(set => ({
	transfers: [],
	setTransfers(fn) {
		set(state => ({
			transfers: typeof fn === "function" ? fn(state.transfers) : fn
		}))
	}
}))

export default useTransfersStore
