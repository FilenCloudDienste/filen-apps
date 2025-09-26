import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import queryUpdater from "./updater"

export const BASE_QUERY_KEY = "useNotesTagsQuery"

export async function fetchNotesTags() {
	const notes = await worker.sdk("listNoteTags")

	return notes
}

export function useNotesTagsQuery(
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchNotesTags>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY],
		queryFn: () => fetchNotesTags()
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchNotesTags>>, Error>
}

export async function notesTagsQueryUpdate({
	updater
}: {
	updater:
		| Awaited<ReturnType<typeof fetchNotesTags>>
		| ((prev: Awaited<ReturnType<typeof fetchNotesTags>>) => Awaited<ReturnType<typeof fetchNotesTags>>)
}): Promise<void> {
	await queryUpdater.set<Awaited<ReturnType<typeof fetchNotesTags>>>([BASE_QUERY_KEY], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchNotesTags>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function notesTagsQueryRefetch(): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY]
	})
}

export default useNotesTagsQuery
