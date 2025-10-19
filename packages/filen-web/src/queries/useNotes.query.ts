import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import queryUpdater from "./updater"
import cacheMap from "@/lib/cacheMap"

export const BASE_QUERY_KEY = "useNotesQuery"

export async function fetchNotes() {
	const notes = await worker.sdk("listNotes")

	for (const note of notes) {
		cacheMap.noteUuidToNote.set(note.uuid, note)
	}

	return notes
}

export function useNotesQuery(
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchNotes>>, Error> {
	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY],
		queryFn: () => fetchNotes()
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchNotes>>, Error>
}

export function notesQueryUpdate({
	updater
}: {
	updater:
		| Awaited<ReturnType<typeof fetchNotes>>
		| ((prev: Awaited<ReturnType<typeof fetchNotes>>) => Awaited<ReturnType<typeof fetchNotes>>)
}): void {
	queryUpdater.set<Awaited<ReturnType<typeof fetchNotes>>>([BASE_QUERY_KEY], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchNotes>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function notesQueryRefetch(): Promise<void> {
	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY]
	})
}

export default useNotesQuery
