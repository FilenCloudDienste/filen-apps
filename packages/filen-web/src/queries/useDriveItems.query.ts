import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import type { File as FilenSdkRsFile, Dir as FilenSdkRsDir } from "@filen/sdk-rs"
import pathModule from "path"
import cacheMap from "@/lib/cacheMap"
import queryUpdater from "./updater"

export const BASE_QUERY_KEY = "useDriveItemsQuery"

export type ExtraData = {
	undecryptable: boolean
	size: bigint
}

export type DriveItemFile = FilenSdkRsFile & ExtraData
export type DriveItemDirectory = FilenSdkRsDir & ExtraData

export type DriveItem =
	| {
			type: "directory"
			data: DriveItemDirectory
	  }
	| {
			type: "file"
			data: DriveItemFile
	  }

export type UseDriveItemsQueryParams = {
	path: string
}

export async function fetchDriveItems(params: UseDriveItemsQueryParams): Promise<DriveItem[]> {
	const parsedPath = pathModule.parse(params.path)
	const root = await worker.sdk("root")
	const dir =
		parsedPath.base.length === 0 || parsedPath.base === "/" ? root : (cacheMap.directoryUUIDToDirEnum.get(parsedPath.base) ?? root)
	const [dirs, files] = await worker.sdk("listDir", dir)
	const items: DriveItem[] = []

	for (const dir of dirs) {
		items.push({
			type: "directory",
			data: {
				...dir,
				undecryptable: !dir.meta,
				size: 0n
			}
		})

		cacheMap.directoryUUIDToDirEnum.set(dir.uuid, dir)
		cacheMap.directoryUUIDToName.set(dir.uuid, dir.meta?.name ?? dir.uuid)
	}

	for (const file of files) {
		items.push({
			type: "file",
			data: {
				...file,
				undecryptable: !file.meta
			}
		})
	}

	return items
}

export function useDriveItemsQuery(
	params: UseDriveItemsQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchDriveItems>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY, params],
		queryFn: () => fetchDriveItems(params)
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchDriveItems>>, Error>
}

export function driveItemsQueryUpdate({
	updater,
	...params
}: Parameters<typeof fetchDriveItems>[0] & {
	updater:
		| Awaited<ReturnType<typeof fetchDriveItems>>
		| ((prev: Awaited<ReturnType<typeof fetchDriveItems>>) => Awaited<ReturnType<typeof fetchDriveItems>>)
}): void {
	queryUpdater.set<Awaited<ReturnType<typeof fetchDriveItems>>>([BASE_QUERY_KEY, params], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchDriveItems>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function driveItemsQueryRefetch(params: Parameters<typeof fetchDriveItems>[0]): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, params]
	})
}

export default useDriveItemsQuery
