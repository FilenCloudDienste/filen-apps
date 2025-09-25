import idb from "./idb"
import worker from "@/lib/worker"
import auth from "@/lib/auth"
import serviceWorker from "./serviceWorker"
import cacheMap from "./cacheMap"
import { restoreQueries } from "@/queries/client"

export function checkOpfsAvailable(): boolean {
	return (
		globalThis &&
		globalThis.window.navigator &&
		globalThis.window.navigator.storage &&
		typeof globalThis.window.navigator.storage.getDirectory === "function"
	)
}

export function checkServiceWorkerAvailable(): boolean {
	return globalThis && globalThis.window.navigator && "serviceWorker" in globalThis.window.navigator
}

export function checkWasmAvailable(): boolean {
	return globalThis && globalThis.window && "WebAssembly" in globalThis.window
}

export function checkIndexedDbAvailable(): boolean {
	return globalThis && globalThis.window && "indexedDB" in globalThis.window
}

export async function setup(): Promise<
	| {
			success: false
			errorType: "opfs" | "loggedOut" | "wasm" | "serviceWorker" | "indexedDb"
	  }
	| {
			success: true
	  }
> {
	console.log("Starting setup...")

	if (!checkOpfsAvailable()) {
		return {
			success: false,
			errorType: "opfs"
		}
	}

	if (!checkServiceWorkerAvailable()) {
		return {
			success: false,
			errorType: "serviceWorker"
		}
	}

	if (!checkWasmAvailable()) {
		return {
			success: false,
			errorType: "wasm"
		}
	}

	if (!checkIndexedDbAvailable()) {
		return {
			success: false,
			errorType: "indexedDb"
		}
	}

	await idb.waitForInit()

	await restoreQueries()

	const authed = await auth.isAuthed()

	if (authed) {
		const client = await auth.getClient()

		if (!client) {
			await auth.logout()

			return {
				success: false,
				errorType: "loggedOut"
			}
		}

		await worker.direct.setClient(client)
		await idb.set("serviceWorkerClient", client)

		const root = await worker.sdk("root")

		cacheMap.driveRoot = root
	}

	await serviceWorker.register()

	console.log("Setup complete!")

	return {
		success: true
	}
}

export default setup
