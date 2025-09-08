// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TRANSFERABLE_CONSTRUCTORS = new Set<any>()

if (typeof ArrayBuffer !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(ArrayBuffer)
if (typeof MessagePort !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(MessagePort)
if (typeof ImageBitmap !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(ImageBitmap)
if (typeof OffscreenCanvas !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(OffscreenCanvas)
if (typeof ReadableStream !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(ReadableStream)
if (typeof WritableStream !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(WritableStream)
if (typeof MediaSourceHandle !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(MediaSourceHandle)
if (typeof TransformStream !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(TransformStream)
if (typeof AudioData !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(AudioData)
if (typeof VideoFrame !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(VideoFrame)
if (typeof RTCDataChannel !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(RTCDataChannel)
if (typeof MIDIAccess !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(MIDIAccess)
if (typeof MediaStreamTrack !== "undefined") TRANSFERABLE_CONSTRUCTORS.add(MediaStreamTrack)

export function extractTransferables(value: unknown): Transferable[] {
	const transferables: Transferable[] = []

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function traverse(obj: any): void {
		if (!obj || typeof obj !== "object") {
			return
		}

		if (TRANSFERABLE_CONSTRUCTORS.has(obj.constructor)) {
			transferables.push(obj)

			return
		}

		if (obj.buffer && obj.buffer instanceof ArrayBuffer) {
			transferables.push(obj.buffer)

			return
		}

		if (Array.isArray(obj)) {
			for (let i = 0; i < obj.length; i++) {
				traverse(obj[i])
			}
		} else {
			for (const key in obj) {
				// eslint-disable-next-line no-prototype-builtins
				if (obj.hasOwnProperty(key)) {
					traverse(obj[key])
				}
			}
		}
	}

	traverse(value)

	return transferables
}
