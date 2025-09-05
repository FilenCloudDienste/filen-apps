import type { DirEnum as FilenSdkRsDirEnum, Root as FilenSdkRsRoot } from "@filen/sdk-rs"

export const cacheMap = {
	availableThumbnails: new Map<string, string>(),
	directoryUUIDToName: new Map<string, string>(),
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	kv: new Map<string, any>(),
	directoryUUIDToDirEnum: new Map<string, FilenSdkRsDirEnum>(),
	driveRoot: null as FilenSdkRsRoot | null,
	thumbnails: new Map<string, string>()
}

export default cacheMap
