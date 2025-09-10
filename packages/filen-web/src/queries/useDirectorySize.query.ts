import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import type { DirSizeResponse } from "@filen/sdk-rs"
import cacheMap from "@/lib/cacheMap"
import queryUpdater from "./updater"

export const BASE_QUERY_KEY = "useDirectorySizeQuery"

export type UseDirectorySizeQueryParams = {
	uuid: string
}

export async function fetchDirectorySize(params: UseDirectorySizeQueryParams): Promise<DirSizeResponse> {
	const dir = cacheMap.directoryUUIDToDirEnum.get(params.uuid)

	if (!dir || !("parent" in dir)) {
		throw new Error("Directory not found.")
	}

	return await worker.sdk("getDirSize", dir)
}

export function useDirectorySizeQuery(
	params: UseDirectorySizeQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchDirectorySize>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY, params],
		queryFn: () => fetchDirectorySize(params),
		staleTime: 60000 * 5
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchDirectorySize>>, Error>
}

export function directorySizeQueryUpdate({
	updater,
	...params
}: Parameters<typeof fetchDirectorySize>[0] & {
	updater:
		| Awaited<ReturnType<typeof fetchDirectorySize>>
		| ((prev: Awaited<ReturnType<typeof fetchDirectorySize>>) => Awaited<ReturnType<typeof fetchDirectorySize>>)
}): void {
	queryUpdater.set<Awaited<ReturnType<typeof fetchDirectorySize>>>([BASE_QUERY_KEY, params], prev => {
		const currentData =
			prev ??
			({
				size: 0n,
				files: 0n,
				dirs: 0n
			} satisfies Awaited<ReturnType<typeof fetchDirectorySize>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function directorySizeQueryRefetch(params: Parameters<typeof fetchDirectorySize>[0]): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, params]
	})
}

export default useDirectorySizeQuery
