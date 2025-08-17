// @ts-expect-error Obviously not typed
export const IS_DESKTOP: boolean = typeof globalThis !== "undefined" && typeof globalThis.desktopApi !== "undefined"
