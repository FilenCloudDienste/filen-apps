import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS } from "./client"
import type { DirSizeResponse } from "@filen/sdk-rs"
import cacheMap from "@/lib/cacheMap"

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

export function useDirectorySizeQuery(params: UseDirectorySizeQueryParams, options?: Omit<UseQueryOptions, "queryKey" | "queryFn">) {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: ["useDirectorySizeQuery", params],
		queryFn: () => fetchDirectorySize(params),
		staleTime: 60000 * 5
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchDirectorySize>>, Error>
}

export default useDirectorySizeQuery
