import Semaphore from "./semaphore"

export class ServiceWorker {
	private isRegistered: boolean = false
	private readonly mutex: Semaphore = new Semaphore(1)
	private registration: ServiceWorkerRegistration | null = null

	public async register(): Promise<void> {
		await this.mutex.acquire()

		try {
			if (this.isRegistered || !window || !window.navigator || !("serviceWorker" in window.navigator)) {
				return
			}

			this.registration = await window.navigator.serviceWorker.register(
				import.meta.env.MODE === "production" ? "/sw.js" : "/dev-sw.js?dev-sw",
				{
					scope: "/",
					type: import.meta.env.MODE === "production" ? "classic" : "module"
				}
			)

			await this.registration.update()

			this.isRegistered = true

			console.log("Service worker registered!")
		} catch (e) {
			console.error(e)
		} finally {
			this.mutex.release()
		}
	}

	public getRegistration(): ServiceWorkerRegistration | null {
		return this.registration
	}
}

export const serviceWorker = new ServiceWorker()

export default serviceWorker
