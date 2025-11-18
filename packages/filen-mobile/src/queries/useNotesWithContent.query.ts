import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import { DEFAULT_QUERY_OPTIONS, useDefaultQueryParams } from "@/queries/client"
import notes from "@/lib/notes"
import useRefreshOnFocus from "@/queries/useRefreshOnFocus"

export const BASE_QUERY_KEY = "useNotesWithContentQuery"

export async function fetchData(params?: { signal?: AbortSignal }) {
	const all = await notes.list(params?.signal)
	const withContent = await Promise.all(
		all.map(async note => {
			const content = await notes.getContent({
				note,
				signal: params?.signal
			})

			return {
				...note,
				content
			}
		})
	)

	return withContent
}

export function useNotesWithContentQuery(
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error> {
	const defaultParams = useDefaultQueryParams(options)

	const query = useQuery({
		...DEFAULT_QUERY_OPTIONS,
		...defaultParams,
		...options,
		queryKey: [BASE_QUERY_KEY],
		queryFn: ({ signal }) =>
			fetchData({
				signal
			})
	})

	useRefreshOnFocus({
		isEnabled: query.isEnabled,
		refetch: query.refetch
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error>
}

export default useNotesWithContentQuery
