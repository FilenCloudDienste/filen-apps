import type { Dir, Note, SharedDir } from "@filen/sdk-rs"

export const cache = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	secureStore: new Map<string, any>(),
	directoryUuidToName: new Map<string, string>(),
	directoryUuidToDir: new Map<string, Dir>(),
	noteUuidToNote: new Map<string, Note>(),
	sharedDirUuidToDir: new Map<string, SharedDir>(),
	sharedDirectoryUuidToName: new Map<string, string>(),
	sharedDirectoryUuidToDir: new Map<string, SharedDir>()
}

export default cache
