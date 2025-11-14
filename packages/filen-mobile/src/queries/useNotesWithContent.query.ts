import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import { DEFAULT_QUERY_OPTIONS, useDefaultQueryParams } from "@/queries/client"
import auth from "@/lib/auth"
import useRefreshOnFocus from "@/queries/useRefreshOnFocus"

export const BASE_QUERY_KEY = "useNotesWithContentQuery"

export async function fetchData(params?: { signal?: AbortSignal }) {
	const sdkClient = await auth.getSdkClient()

	const notes = await sdkClient.listNotes(
		params?.signal
			? {
					signal: params.signal
				}
			: undefined
	)

	const withContent = await Promise.all(
		notes.map(async note => {
			const content = await sdkClient.getNoteContent(
				note,
				params?.signal
					? {
							signal: params.signal
						}
					: undefined
			)

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
