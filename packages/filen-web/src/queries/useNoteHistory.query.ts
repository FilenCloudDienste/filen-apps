import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import worker from "@/lib/worker"
import { DEFAULT_QUERY_OPTIONS, queryClient } from "./client"
import queryUpdater from "./updater"
import cacheMap from "@/lib/cacheMap"
import { sortParams } from "@/lib/utils"

export const BASE_QUERY_KEY = "useNoteHistoryQuery"

export type UseNoteHistoryQueryParams = {
	uuid: string
}

export async function fetchNoteHistory(params: UseNoteHistoryQueryParams) {
	const note = cacheMap.noteUuidToNote.get(params.uuid)

	if (!note) {
		throw new Error("Note not found.")
	}

	const content = await worker.sdk("getNoteHistory", note)

	return content
}

export function useNoteHistoryQuery(
	params: UseNoteHistoryQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchNoteHistory>>, Error> {
	const sortedParams = sortParams(params)

	const query = useQuery({
		...(DEFAULT_QUERY_OPTIONS as Omit<UseQueryOptions, "queryKey" | "queryFn">),
		...options,
		queryKey: [BASE_QUERY_KEY, sortedParams],
		queryFn: () => fetchNoteHistory(sortedParams)
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchNoteHistory>>, Error>
}

export function noteHistoryQueryUpdate({
	updater,
	params
}: {
	params: Parameters<typeof fetchNoteHistory>[0]
} & {
	updater:
		| Awaited<ReturnType<typeof fetchNoteHistory>>
		| ((prev: Awaited<ReturnType<typeof fetchNoteHistory>>) => Awaited<ReturnType<typeof fetchNoteHistory>>)
}): void {
	const sortedParams = sortParams(params)

	queryUpdater.set<Awaited<ReturnType<typeof fetchNoteHistory>>>([BASE_QUERY_KEY, sortedParams], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchNoteHistory>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function noteHistoryQueryRefetch(params: Parameters<typeof fetchNoteHistory>[0]): Promise<void> {
	const sortedParams = sortParams(params)

	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, sortedParams]
	})
}

export default useNoteHistoryQuery
