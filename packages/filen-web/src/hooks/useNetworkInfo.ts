import { useNetworkState, type NetworkState } from "@uidotdev/usehooks"

export type UseNetworkInfo = NetworkState & {
	api: boolean
}

export class NetworkCheck {
	private api: boolean = true
	private interval: ReturnType<typeof setInterval> | undefined = undefined

	public constructor() {
		this.start()
	}

	private start(): void {
		clearInterval(this.interval)

		this.check()

		this.interval = setInterval(() => {
			this.check()
		}, 60000)
	}

	private async check(): Promise<void> {
		const controller = new AbortController()

		const timeout = setTimeout(() => {
			controller.abort()
		}, 15000)

		try {
			const response = await fetch("https://gateway.filen.io", {
				signal: controller.signal,
				method: "GET"
			})

			this.api = response.status === 200
		} catch (e) {
			console.error(e)

			this.api = false
		} finally {
			clearTimeout(timeout)
		}
	}

	public get(): boolean {
		return this.api
	}
}

export const networkCheck = new NetworkCheck()

export const useNetworkInfo = () => {
	const networkState = useNetworkState()

	return {
		...networkState,
		api: networkCheck.get() // TODO subscribe to events instead of getting value on every render
	} satisfies UseNetworkInfo
}
