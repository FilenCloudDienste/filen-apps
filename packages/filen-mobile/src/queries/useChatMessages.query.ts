import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import { DEFAULT_QUERY_OPTIONS, queryClient, useDefaultQueryParams, queryUpdater } from "@/queries/client"
import auth from "@/lib/auth"
import useRefreshOnFocus from "@/queries/useRefreshOnFocus"
import cache from "@/lib/cache"
import { sortParams } from "@filen/utils"

export const BASE_QUERY_KEY = "useChatMessagesQuery"

export type UseChatMessagesQueryParams = {
	uuid: string
}

export async function fetchData(
	params: UseChatMessagesQueryParams & {
		signal?: AbortSignal
	}
) {
	const sdkClient = await auth.getSdkClient()

	const chat = cache.chatUuidToChat.get(params.uuid)

	if (!chat) {
		throw new Error("Chat not found")
	}

	return await sdkClient.listMessagesBefore(
		chat,
		BigInt(Date.now() + 3600000),
		params?.signal
			? {
					signal: params.signal
				}
			: undefined
	)
}

export function useChatMessagesQuery(
	params: UseChatMessagesQueryParams,
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

export function chatMessagesQueryUpdate({
	params,
	updater
}: {
	params: UseChatMessagesQueryParams
	updater:
		| Awaited<ReturnType<typeof fetchData>>
		| ((prev: Awaited<ReturnType<typeof fetchData>>) => Awaited<ReturnType<typeof fetchData>>)
}) {
	const sortedParams = sortParams(params)

	queryUpdater.set<Awaited<ReturnType<typeof fetchData>>>([BASE_QUERY_KEY, sortedParams], prev => {
		return typeof updater === "function" ? updater(prev ?? []) : updater
	})
}

export async function chatMessagesQueryRefetch(params: UseChatMessagesQueryParams): Promise<void> {
	const sortedParams = sortParams(params)

	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, sortedParams]
	})
}

export function chatMessagesQueryGet(params: UseChatMessagesQueryParams) {
	const sortedParams = sortParams(params)

	return queryUpdater.get<Awaited<ReturnType<typeof fetchData>>>([BASE_QUERY_KEY, sortedParams])
}

export default useChatMessagesQuery
