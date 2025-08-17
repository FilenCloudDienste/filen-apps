/// <reference types="@types/serviceworker" />

self.addEventListener("install", () => {
	self.skipWaiting().catch(console.error)
})

self.addEventListener("activate", (event: ExtendableEvent) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener("message", () => {})

self.addEventListener("fetch", (e: FetchEvent) => {
	try {
		switch (new URL(e.request.url).pathname) {
			case "/ping": {
				e.respondWith(new Response("pong"))

				break
			}
		}
	} catch (err) {
		console.error(err)

		return null
	}
})
