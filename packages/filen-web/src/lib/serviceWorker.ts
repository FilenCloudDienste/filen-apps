import Semaphore from "./semaphore"
import idb from "./idb"
import type { NonRootObject as FilenSdkRsNonRootObject } from "@filen/sdk-rs"
import { pack } from "msgpackr"

export type ServiceWorkerClientId = {
	id: string
	timeoutAt: number
}

export class ServiceWorker {
	private isRegistered: boolean = false
	private readonly mutex: Semaphore = new Semaphore(1)
	private registration: ServiceWorkerRegistration | null = null
	private readonly clientId: string = globalThis.crypto.randomUUID()
	private renewClientIdInterval: ReturnType<typeof setInterval> | undefined = undefined

	public constructor() {
		this.renewClientIds().catch(console.error)
	}

	public async register(): Promise<void> {
		await this.mutex.acquire()

		try {
			if (this.isRegistered) {
				return
			}

			if (!window || !window.navigator || !("serviceWorker" in window.navigator)) {
				throw new Error("Service Worker is not supported in this browser.")
			}

			this.registration = await window.navigator.serviceWorker.register(
				import.meta.env.MODE === "production" ? "/sw.js" : "/dev-sw.js?dev-sw",
				{
					scope: "/",
					type: import.meta.env.MODE === "production" ? "classic" : "module"
				}
			)

			await this.registration.update()

			await this.renewClientIds()

			this.isRegistered = true

			console.log("Service worker registered!")
		} catch (e) {
			console.error(e)
		} finally {
			this.mutex.release()
		}
	}

	private async setClientIds(): Promise<void> {
		const current = (await idb.get<ServiceWorkerClientId[]>("serviceWorkerClientIds")) ?? []

		await idb
			.set("serviceWorkerClientIds", [
				...current.filter(c => c.id !== this.clientId && c.timeoutAt > Date.now()),
				{
					id: this.clientId,
					timeoutAt: Date.now() + 60000
				} satisfies ServiceWorkerClientId
			])
			.catch(console.error)
	}

	private async renewClientIds(): Promise<void> {
		clearInterval(this.renewClientIdInterval)

		await this.setClientIds()

		this.renewClientIdInterval = setInterval(() => {
			this.setClientIds().catch(console.error)
		}, 5000)
	}

	public getRegistration(): ServiceWorkerRegistration | null {
		return this.registration
	}

	public getClientId(): string | null {
		return this.clientId
	}

	public buildDownloadUrl({
		items,
		type = "download",
		name
	}: {
		items: FilenSdkRsNonRootObject[]
		type?: "download" | "stream"
		name?: string
	}): string {
		const baseUrl = new URL("/serviceWorker/download", globalThis.window.location.origin)

		baseUrl.searchParams.set("clientId", encodeURIComponent(this.clientId))

		if (type) {
			baseUrl.searchParams.set("type", encodeURIComponent(type))
		}

		if (name) {
			baseUrl.searchParams.set("name", encodeURIComponent(name))
		}

		if (items && items.length > 0) {
			baseUrl.searchParams.set("items", encodeURIComponent(Buffer.from(pack(items)).toString("base64")))
		}

		return baseUrl.toString()
	}
}

export const serviceWorker = new ServiceWorker()

export default serviceWorker
