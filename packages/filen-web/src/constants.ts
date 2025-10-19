// @ts-expect-error Obviously not typed
export const IS_DESKTOP: boolean = typeof globalThis !== "undefined" && typeof globalThis.desktopApi !== "undefined"

export const ONLINE_TIMEOUT: number = 5 * 60 * 1000 // 5 minutes
export const QUERY_CLIENT_VERSION: number = 1
export const QUERY_CLIENT_PERSISTER_PREFIX: string = `reactQuery_v${QUERY_CLIENT_VERSION}`
export const UNCACHED_QUERY_CLIENT_KEYS: string[] = ["thumbnailObjectUrlQuery", "textPreviewQuery", "useSdkQuery"]
export const QUERY_CLIENT_CACHE_TIME: number = 86400 * 1000 * 365
export const QUERY_CLIENT_BUSTER: number = 1
