import queryClient from "./client"
import Semaphore from "@/lib/semaphore"

export class QueryUpdater {
	private readonly updateMutex: Semaphore = new Semaphore(1)

	public async get<T>(queryKey: unknown[]): Promise<T | undefined> {
		await this.updateMutex.acquire()

		try {
			return queryClient.getQueryData<T>(queryKey)
		} finally {
			this.updateMutex.release()
		}
	}

	public async set<T>(queryKey: unknown[], updater: T | ((prev: T) => T)): Promise<void> {
		await this.updateMutex.acquire()

		try {
			queryClient.setQueryData(
				queryKey,
				(oldData: T | undefined) => {
					if (typeof updater === "function") {
						return (updater as (prev: T | undefined) => T)(oldData)
					}

					return updater
				},
				{
					updatedAt: Date.now()
				}
			)
		} finally {
			this.updateMutex.release()
		}
	}
}

export const queryUpdater = new QueryUpdater()

export default queryUpdater
