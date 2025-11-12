import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import { DEFAULT_QUERY_OPTIONS, useDefaultQueryParams } from "@/queries/client"
import auth from "@/lib/auth"
import useRefreshOnFocus from "@/queries/useRefreshOnFocus"
import { sortParams } from "@filen/utils"
import cache from "@/lib/cache"

export const BASE_QUERY_KEY = "useDirectorySizeQuery"

export type UseDirectorySizeQueryParams = {
	directoryUuid: string
}

export async function fetchData(
	params: UseDirectorySizeQueryParams & {
		signal?: AbortSignal
	}
) {
	const sdkClient = await auth.getSdkClient()
	const dir = cache.directoryUuidToDirForSize.get(params.directoryUuid)

	if (!dir) {
		throw new Error("Directory not found in cache")
	}

	return await sdkClient.getDirSize(
		dir,
		params?.signal
			? {
					signal: params.signal
				}
			: undefined
	)
}

export function useDirectorySizeQuery(
	params: UseDirectorySizeQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error> {
	const defaultParams = useDefaultQueryParams(options)
	const sortedParams = sortParams(params)

	const query = useQuery({
		...DEFAULT_QUERY_OPTIONS,
		...defaultParams,
		...options,
		queryKey: [BASE_QUERY_KEY, sortedParams],
		queryFn: ({ signal }) =>
			fetchData({
				...sortedParams,
				signal
			})
	})

	useRefreshOnFocus({
		isEnabled: query.isEnabled,
		refetch: query.refetch
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error>
}

export default useDirectorySizeQuery
