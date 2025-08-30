import sqlite from "./sqlite"
import worker from "@/lib/worker"
import authService from "@/services/auth.service"
import serviceWorker from "./serviceWorker"
import { set } from "idb-keyval"
import cacheMap from "./cacheMap"
import { restoreQueries } from "@/queries/client"

export function checkOpfsAvailable(): boolean {
	return globalThis.navigator && globalThis.navigator.storage && typeof globalThis.navigator.storage.getDirectory === "function"
}

export async function setup(): Promise<
	| {
			success: false
			errorType: "opfs" | "loggedOut"
			errorMessage?: string
	  }
	| {
			success: true
	  }
> {
	console.log("Starting setup...")

	if (!checkOpfsAvailable()) {
		return {
			success: false,
			errorType: "opfs",
			errorMessage: "Your browser does not support the necessary file system APIs."
		}
	}

	await sqlite.waitForInit()

	await restoreQueries()

	const authed = await authService.isAuthed()

	if (authed) {
		const client = await authService.getClient()

		if (!client) {
			await authService.logout()

			return {
				success: false,
				errorType: "loggedOut"
			}
		}

		await worker.direct.setClient(client)

		const root = await worker.sdk("root")

		cacheMap.driveRoot = root
	}

	await serviceWorker.register()

	await set("serviceWorkerId", globalThis.crypto.randomUUID())

	console.log("Setup complete!")

	return {
		success: true
	}
}

export default setup
