import queryClient from "./client"

export class QueryUpdater {
	public get<T>(queryKey: unknown[]): T | undefined {
		return queryClient.getQueryData(queryKey)
	}

	public set<T>(queryKey: unknown[], updater: T | ((prev: T) => T)) {
		try {
			return queryClient.setQueryData(
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
		} catch (e) {
			console.error(e)
		}
	}
}

export const queryUpdater = new QueryUpdater()

export default queryUpdater
