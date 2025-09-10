// @ts-expect-error Obviously not typed
export const IS_DESKTOP: boolean = typeof globalThis !== "undefined" && typeof globalThis.desktopApi !== "undefined"

export const ONLINE_TIMEOUT: number = 5 * 60 * 1000 // 5 minutes
