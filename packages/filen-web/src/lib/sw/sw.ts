/// <reference types="@types/serviceworker" />

import { get as idbGet } from "idb-keyval"
import initFilenSdkRs, {
	type Client as FilenSdkRsClient,
	fromStringified as filenSdkRsFromStringified,
	type NonRootObject as FilenSdkRsNonRootObject,
	type StringifiedClient as FilenSdkRsStringifiedClient
} from "@filen/sdk-rs"
import Semaphore from "../semaphore"
import filenSdkRsWasmPath from "@filen/sdk-rs/browser/sdk-rs_bg.wasm?url"
import { unpack } from "msgpackr"
import mime from "mime"
import type { ServiceWorkerClientId } from "../serviceWorker"

let filenSdkRsWasmInitialized: boolean = false
let filenSdkRsClient: FilenSdkRsClient | null = null
const initMutex: Semaphore = new Semaphore(1)

export async function waitForFilenSdkRsClient(): Promise<FilenSdkRsStringifiedClient> {
	while (!(await idbGet("serviceWorkerClient"))) {
		await new Promise<void>(resolve => setTimeout(resolve, 100))
	}

	return unpack((await idbGet("serviceWorkerClient"))!)
}

export async function waitForFilenSdkRsWasmInit(): Promise<void> {
	await initMutex.acquire()

	try {
		const client = await waitForFilenSdkRsClient()

		while (!filenSdkRsWasmInitialized) {
			await initFilenSdkRs(fetch(filenSdkRsWasmPath))

			filenSdkRsClient = filenSdkRsFromStringified(client)

			filenSdkRsWasmInitialized = true
		}
	} finally {
		initMutex.release()
	}
}

self.addEventListener("install", () => {
	self.skipWaiting().catch(console.error)
})

self.addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(
		(async () => {
			await waitForFilenSdkRsWasmInit()

			self.clients.claim()
		})()
	)
})

export function parseByteRange(range: string | null, totalLength: number): { start: number; end: number } | null {
	if (!range) {
		return null
	}

	const [unit, rangeValue] = range.split("=")

	if (unit !== "bytes" || !rangeValue) {
		return null
	}

	const [startStr, endStr] = rangeValue.split("-")

	if (!startStr) {
		return null
	}

	const start = parseInt(startStr, 10)
	const end = endStr ? parseInt(endStr, 10) : totalLength - 1

	if (isNaN(start) || isNaN(end) || start < 0 || end >= totalLength || start > end) {
		return null
	}

	return {
		start,
		end
	}
}

export function createContentDisposition(fileName?: string): string {
	if (!fileName) {
		fileName = "file"
	}

	const asciiFilename = fileName
		// eslint-disable-next-line no-control-regex
		.replace(/[^\x00-\x7F]/g, "_")
		.replace(/[<>:"/\\|?*]/g, "_")
		.substring(0, 100)

	const utf8Filename = encodeURIComponent(fileName)

	return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${utf8Filename}`
}

export async function validateClientId(clientId: string): Promise<boolean> {
	const idbClientIds = await idbGet("serviceWorkerClientIds")
	const idbClientIdsDecoded: ServiceWorkerClientId[] = idbClientIds ? unpack(idbClientIds) : []
	const idbClientId = idbClientIdsDecoded.find(c => c.id === clientId)

	if (!idbClientId) {
		return false
	}

	return idbClientId.id === clientId && idbClientId.timeoutAt > Date.now()
}

export async function stream(e: FetchEvent): Promise<Response> {
	await waitForFilenSdkRsWasmInit()

	if (!filenSdkRsClient) {
		return new Response("Sdk not initialized", {
			status: 500
		})
	}

	const url = new URL(e.request.url)
	const clientId = url.searchParams.get("clientId") ?? null
	const items = url.searchParams.get("items") ?? null
	const type = (url.searchParams.get("type") ?? "download") as "download" | "stream"
	const name = url.searchParams.get("name") ?? null

	if (!clientId || !items || !["stream", "download"].includes(type)) {
		return new Response("Missing clientId or items parameter", {
			status: 400
		})
	}

	if (!(await validateClientId(clientId))) {
		return new Response("Invalid clientId", {
			status: 401
		})
	}

	let itemsDecoded: FilenSdkRsNonRootObject[] = []

	try {
		itemsDecoded = unpack(Buffer.from(decodeURIComponent(items), "base64")) as FilenSdkRsNonRootObject[]
	} catch (e) {
		console.error(e)

		return new Response("Invalid items", {
			status: 400
		})
	}

	if (itemsDecoded.length === 0) {
		return new Response("No items provided", {
			status: 400
		})
	}

	let responseStatus = 200
	const responseHeaders = new Headers({
		"Content-Security-Policy": "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
		"X-Content-Security-Policy": "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
		"X-WebKit-CSP": "default-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
		"X-XSS-Protection": "1; mode=block",
		"Cross-Origin-Embedder-Policy": "require-corp",
		"X-Content-Type-Options": "nosniff",
		"Cache-Control": "public, max-age=31536000, immutable",
		Expires: new Date(Date.now() + 31536000 * 1000).toUTCString(),
		ETag: `"${Buffer.from(itemsDecoded.map(item => item.uuid).join(","), "utf-8").toString("hex")}"`,
		"Last-Modified": "Wed, 01 Sep 2025 00:00:00 GMT"
	})

	if (itemsDecoded.length > 1 || itemsDecoded.some(item => item.type === "dir")) {
		responseHeaders.set("Content-Type", "application/zip")
		responseHeaders.set(
			"Content-Disposition",
			createContentDisposition(
				itemsDecoded.length === 1
					? itemsDecoded.at(0)?.meta?.name
						? `${itemsDecoded.at(0)?.meta?.name}.zip`
						: `${self.crypto.randomUUID()}.zip`
					: name
						? `${name}.zip`
						: `${self.crypto.randomUUID()}.zip`
			)
		)

		const transformer = new TransformStream()

		filenSdkRsClient
			.downloadItemsToZip({
				items: itemsDecoded,
				writer: transformer.writable,
				abortSignal: e.request.signal
			})
			.catch(err => {
				console.error(err)

				transformer.writable.abort(err).catch(() => {})
				transformer.readable.cancel(err).catch(() => {})
			})

		return new Response(transformer.readable, {
			headers: responseHeaders,
			status: responseStatus
		})
	}

	const item = itemsDecoded.at(0)

	if (!item || item.type !== "file") {
		return new Response("Invalid item", {
			status: 400
		})
	}

	const totalSize = Number(item.size)
	const range =
		e.request.headers.get("range") ??
		e.request.headers.get("Range") ??
		e.request.headers.get("content-range") ??
		e.request.headers.get("Content-Range") ??
		null
	let start = 0
	let end = totalSize - 1

	responseHeaders.set(
		"Content-Type",
		name ? (mime.getType(name) ?? "application/octet-stream") : (item.meta?.mime ?? "application/octet-stream")
	)

	if (type === "stream") {
		const parsedRange = parseByteRange(range, totalSize)

		if (!parsedRange) {
			return new Response("Invalid range", {
				status: 400
			})
		}

		start = parsedRange.start
		end = parsedRange.end

		responseStatus = 206

		responseHeaders.set("Accept-Ranges", "bytes")
		responseHeaders.set("Content-Length", (end - start + 1).toString())
		responseHeaders.set("Content-Range", `bytes ${start}-${end}/${totalSize}`)
	} else {
		responseStatus = 200

		responseHeaders.set("Content-Disposition", createContentDisposition(name ?? item.meta?.name ?? item.uuid))
		responseHeaders.set("Content-Length", totalSize.toString())
	}

	const transformer = new TransformStream()

	filenSdkRsClient
		.downloadFileToWriter({
			file: item,
			writer: transformer.writable,
			abortSignal: e.request.signal
		})
		.catch(err => {
			console.error(err)

			transformer.writable.abort(err).catch(() => {})
			transformer.readable.cancel(err).catch(() => {})
		})

	return new Response(transformer.readable, {
		headers: responseHeaders,
		status: responseStatus
	})
}

self.addEventListener("fetch", (e: FetchEvent) => {
	try {
		const url = new URL(e.request.url)

		switch (url.pathname) {
			case "/serviceWorker/ping": {
				e.respondWith(new Response("pong"))

				break
			}

			case "/serviceWorker/download": {
				e.respondWith(stream(e))

				break
			}
		}
	} catch (err) {
		console.error(err)

		return null
	}
})
