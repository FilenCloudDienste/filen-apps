import queryClient from "./client"
import type { DriveItem, UseDriveItemsQueryParams } from "./useDriveItems.query"
import type { DirSizeResponse } from "@filen/sdk-rs"
import type { UseDirectorySizeQueryParams } from "./useDirectorySize.query"

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

	public useDirectorySizeQuery({
		updater,
		...params
	}: UseDirectorySizeQueryParams & {
		updater: DirSizeResponse | ((prev: DirSizeResponse) => DirSizeResponse)
	}): void {
		this.set<DirSizeResponse>(["useDirectorySizeQuery", params], prev => {
			const currentData =
				prev ??
				({
					size: 0n,
					files: 0n,
					dirs: 0n
				} satisfies DirSizeResponse)

			return typeof updater === "function" ? updater(currentData) : updater
		})
	}
}

export const queryUpdater = new QueryUpdater()

export default queryUpdater
