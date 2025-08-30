/// <reference types="@types/serviceworker" />

import { get } from "idb-keyval"

self.addEventListener("install", () => {
	self.skipWaiting().catch(console.error)
})

self.addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(self.clients.claim())
})

export async function stream(e: FetchEvent): Promise<Response> {
	const url = new URL(e.request.url)
	const id = url.searchParams.get("id") ?? ""

	const swId = await get("serviceWorkerId")

	return new Response(JSON.stringify({ id, swId }), {
		headers: {
			"Content-Type": "application/json"
		}
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

			case "/serviceWorker/stream": {
				e.respondWith(stream(e))

				break
			}
		}
	} catch (err) {
		console.error(err)

		return null
	}
})
