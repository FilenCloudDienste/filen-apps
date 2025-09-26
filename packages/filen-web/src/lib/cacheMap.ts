import type { DirEnum as FilenSdkRsDirEnum, Root as FilenSdkRsRoot, Note } from "@filen/sdk-rs"

export const cacheMap = {
	directoryUuidToName: new Map<string, string>(),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kv: new Map<string, any>(),
	directoryUuidToDirEnum: new Map<string, FilenSdkRsDirEnum>(),
	driveRoot: null as FilenSdkRsRoot | null,
	thumbnails: new Map<string, string>(),
	noteUuidToNote: new Map<string, Note>()
}

export default cacheMap
