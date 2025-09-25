import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import queryUpdater from "./updater"
import type { Note } from "@filen/sdk-rs"

export const BASE_QUERY_KEY = "useNoteContentQuery"

export type UseNoteContentQueryParams = {
	note: Note
}

export async function fetchNoteContent(params: UseNoteContentQueryParams) {
	const content = await worker.sdk("getNoteContent", params.note)

	return content
}

export function useNoteContentQuery(
	params: UseNoteContentQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchNoteContent>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY, params],
		queryFn: () => fetchNoteContent(params)
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchNoteContent>>, Error>
}

export function noteContentQueryUpdate({
	updater,
	...params
}: Parameters<typeof fetchNoteContent>[0] & {
	updater:
		| Awaited<ReturnType<typeof fetchNoteContent>>
		| ((prev: Awaited<ReturnType<typeof fetchNoteContent>>) => Awaited<ReturnType<typeof fetchNoteContent>>)
}): void {
	queryUpdater.set<Awaited<ReturnType<typeof fetchNoteContent>>>([BASE_QUERY_KEY, params], prev => {
		const currentData = prev ?? (undefined satisfies Awaited<ReturnType<typeof fetchNoteContent>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function noteContentQueryRefetch(params: Parameters<typeof fetchNoteContent>[0]): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, params]
	})
}

export default useNoteContentQuery
