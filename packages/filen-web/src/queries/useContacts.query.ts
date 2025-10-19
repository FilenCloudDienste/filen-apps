import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import type { Contact, BlockedContact } from "@filen/sdk-rs"
import queryUpdater from "./updater"
import { sortParams } from "@/lib/utils"

export const BASE_QUERY_KEY = "useContactsQuery"

export type ContactTagged =
	| ({
			type: "contact"
	  } & Contact)
	| ({
			type: "blocked"
	  } & BlockedContact)

export type UseContactsQueryParams = {
	type: "normal" | "blocked"
}

export async function fetchContacts(params: UseContactsQueryParams): Promise<ContactTagged[]> {
	if (params.type === "blocked") {
		return (await worker.sdk("getBlockedContacts")).map(contact => ({
			...contact,
			type: "blocked"
		}))
	}

	return (await worker.sdk("getContacts")).map(contact => ({
		...contact,
		type: "contact"
	}))
}

export function useContactsQuery(
	params: UseContactsQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchContacts>>, Error> {
	const sortedParams = sortParams(params)

	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		refetchInterval: 15000,
		refetchIntervalInBackground: true,
		refetchOnReconnect: true,
		refetchOnWindowFocus: true,
		queryKey: [BASE_QUERY_KEY, sortedParams],
		queryFn: () => fetchContacts(sortedParams)
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchContacts>>, Error>
}

export function contactsQueryUpdate({
	updater,
	params
}: {
	updater:
		| Awaited<ReturnType<typeof fetchContacts>>
		| ((prev: Awaited<ReturnType<typeof fetchContacts>>) => Awaited<ReturnType<typeof fetchContacts>>)
} & {
	params: Parameters<typeof fetchContacts>[0]
}): void {
	const sortedParams = sortParams(params)

	queryUpdater.set<Awaited<ReturnType<typeof fetchContacts>>>([BASE_QUERY_KEY, sortedParams], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchContacts>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function contactsQueryRefetch(params: Parameters<typeof fetchContacts>[0]): Promise<void> {
	const sortedParams = sortParams(params)

	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, sortedParams]
	})
}

export default useContactsQuery
