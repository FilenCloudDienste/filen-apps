import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import type { ContactRequestIn, ContactRequestOut } from "@filen/sdk-rs"
import queryUpdater from "./updater"

export const BASE_QUERY_KEY = "useContactRequestsQuery"

export async function fetchContactRequests(): Promise<{
	incoming: ContactRequestIn[]
	outgoing: ContactRequestOut[]
}> {
	const [incoming, outgoing] = await Promise.all([worker.sdk("listIncomingContactRequests"), worker.sdk("listOutgoingContactRequests")])

	return {
		incoming,
		outgoing
	}
}

export function useContactRequestsQuery(
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchContactRequests>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		refetchInterval: 5000,
		refetchIntervalInBackground: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
		queryKey: [BASE_QUERY_KEY],
		queryFn: () => fetchContactRequests()
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchContactRequests>>, Error>
}

export async function contactRequestsQueryUpdate({
	updater
}: {
	updater:
		| Awaited<ReturnType<typeof fetchContactRequests>>
		| ((prev: Awaited<ReturnType<typeof fetchContactRequests>>) => Awaited<ReturnType<typeof fetchContactRequests>>)
}): Promise<void> {
	await queryUpdater.set<Awaited<ReturnType<typeof fetchContactRequests>>>([BASE_QUERY_KEY], prev => {
		const currentData =
			prev ??
			({
				incoming: [],
				outgoing: []
			} satisfies Awaited<ReturnType<typeof fetchContactRequests>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function contactRequestsQueryRefetch(): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY]
	})
}

export default useContactRequestsQuery
