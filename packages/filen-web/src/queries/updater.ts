import queryClient from "./client"
import { type DriveItem, type UseDriveItemsQueryParams } from "./useDriveItems.query"

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

	public useDriveItemsQuery({
		updater,
		...params
	}: UseDriveItemsQueryParams & {
		updater: DriveItem[] | ((prev: DriveItem[]) => DriveItem[])
	}): void {
		this.set<DriveItem[]>(["useCloudItemsQuery", params], prev => {
			const currentData = prev ?? ([] satisfies DriveItem[])

			return typeof updater === "function" ? updater(currentData) : updater
		})
	}
}

export const queryUpdater = new QueryUpdater()

export default queryUpdater
