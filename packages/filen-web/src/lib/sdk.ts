import initFilenSdkRs, {
	type Client as FilenSdkRsClient,
	fromStringified as filenSdkRsFromStringified,
	login as filenSdkRsLogin,
	type StringifiedClient as FilenSdkRsStringifiedClient
} from "@filen/sdk-rs"
import Semaphore from "./semaphore"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

export class Sdk {
	private readonly initMutex: Semaphore = new Semaphore(1)
	private filenSdkRsWasmInitialized: boolean = false
	private filenSdkRsClient: FilenSdkRsClient | null = null

	public async waitForFilenSdkRsWasmInit(): Promise<void> {
		await this.initMutex.acquire()

		try {
			while (!this.filenSdkRsWasmInitialized) {
				await initFilenSdkRs()

				this.filenSdkRsWasmInitialized = true
			}
		} finally {
			this.initMutex.release()
		}
	}

	public async getClient(): Promise<FilenSdkRsClient> {
		await this.waitForFilenSdkRsWasmInit()

		while (!this.filenSdkRsClient) {
			await new Promise<void>(resolve => setTimeout(resolve, 100))
		}

		return this.filenSdkRsClient
	}

	public async stringifyClient(): Promise<FilenSdkRsStringifiedClient | null> {
		await this.waitForFilenSdkRsWasmInit()

		if (!this.filenSdkRsClient) {
			return null
		}

		return this.filenSdkRsClient.toStringified()
	}

	public async setClient(stringifiedClient: FilenSdkRsStringifiedClient): Promise<FilenSdkRsClient> {
		await this.waitForFilenSdkRsWasmInit()

		this.filenSdkRsClient = filenSdkRsFromStringified({
			...stringifiedClient,
			maxIoMemoryUsage: 1024 * 1024 * 16,
			maxParallelRequests: 16
		})

		return this.filenSdkRsClient
	}

	public async login(...params: Parameters<typeof filenSdkRsLogin>): Promise<FilenSdkRsClient> {
		await this.waitForFilenSdkRsWasmInit()

		this.filenSdkRsClient = await filenSdkRsLogin(...params)

		return this.filenSdkRsClient
	}
}

export const sdk = new Sdk()

export function useSdk() {
	const query = useQuery({
		queryKey: ["useSdkQuery"],
		queryFn: () => sdk.getClient(),
		refetchOnMount: false,
		refetchInterval: false,
		refetchIntervalInBackground: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
		retryOnMount: false,
		enabled: true,
		retryDelay: Infinity,
		experimental_prefetchInRender: true
	})

	return useMemo(() => {
		if (query.status !== "success" || !query.data) {
			return null
		}

		return query.data
	}, [query.data, query.status])
}

export default sdk
