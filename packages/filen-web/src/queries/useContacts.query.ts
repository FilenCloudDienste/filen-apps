import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS } from "./client"
import type { Contact } from "@filen/sdk-rs"

export async function fetchContacts(): Promise<Contact[]> {
	return await worker.sdk("getContacts")
}

export function useContactsQuery(
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchContacts>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: ["useContactsQuery"],
		queryFn: () => fetchContacts()
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchContacts>>, Error>
}

export default useContactsQuery
