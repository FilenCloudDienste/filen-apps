import { QueryClient, type UseQueryOptions } from "@tanstack/react-query"
import { pack, unpack } from "msgpackr"
import type { DriveItem } from "./useDriveItems.query"
import cacheMap from "@/lib/cacheMap"
import type { Note } from "@filen/sdk-rs"
import idb from "@/lib/idb"
import { QUERY_CLIENT_PERSISTER_PREFIX, UNCACHED_QUERY_CLIENT_KEYS, QUERY_CLIENT_CACHE_TIME, QUERY_CLIENT_BUSTER } from "@/constants"
import { experimental_createQueryPersister, type PersistedQuery } from "@tanstack/query-persist-client-core"
import Semaphore from "@/lib/semaphore"

export const shouldPersistQuery = (query: PersistedQuery): boolean => {
	const shouldNotPersist = (query.queryKey as unknown[]).some(
		queryKey => typeof queryKey === "string" && UNCACHED_QUERY_CLIENT_KEYS.includes(queryKey)
	)

	return !shouldNotPersist && query.state.status === "success"
}

const persisterMutex = new Semaphore(1)

export const queryClientPersisterKv = {
	getItem: async <T>(key: string): Promise<T | null> => {
		return await idb.get<T>(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
	},
	setItem: async (key: string, value: unknown): Promise<void> => {
		await persisterMutex.acquire()

		try {
			await idb.set(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`, value)
		} finally {
			persisterMutex.release()
		}
	},
	removeItem: async (key: string): Promise<void> => {
		await persisterMutex.acquire()

		try {
			return await idb.remove(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
		} finally {
			persisterMutex.release()
		}
	},
	keys: async (): Promise<string[]> => {
		return (await idb.keys()).map(key => key.replace(`${QUERY_CLIENT_PERSISTER_PREFIX}-`, ""))
	},
	clear: async (): Promise<void> => {
		return idb.clear()
	}
} as const

export const queryClientPersister = experimental_createQueryPersister({
	storage: queryClientPersisterKv,
	maxAge: QUERY_CLIENT_CACHE_TIME,
	serialize: query => {
		if (query.state.status !== "success" || !shouldPersistQuery(query)) {
			return undefined
		}

		return pack(query)
	},
	deserialize: query => {
		return unpack(query as Buffer) as unknown as PersistedQuery
	},
	prefix: QUERY_CLIENT_PERSISTER_PREFIX,
	buster: QUERY_CLIENT_BUSTER.toString()
})

export async function restoreQueries(): Promise<void> {
	try {
		const keys = await queryClientPersisterKv.keys()

		await Promise.all(
			keys.map(async key => {
				if (key.startsWith(QUERY_CLIENT_PERSISTER_PREFIX)) {
					const query = (await queryClientPersisterKv.getItem(key)) as unknown as Buffer | null

					if (!query) {
						return
					}

					const persistedQuery = unpack(query) as unknown as PersistedQuery

					if (
						!persistedQuery ||
						!persistedQuery.state ||
						!shouldPersistQuery(persistedQuery) ||
						persistedQuery.state.dataUpdatedAt + QUERY_CLIENT_CACHE_TIME < Date.now() ||
						persistedQuery.state.status !== "success"
					) {
						await queryClientPersisterKv.removeItem(key)

						return
					}

					queryClient.setQueryData(persistedQuery.queryKey, persistedQuery.state.data, {
						updatedAt: persistedQuery.state.dataUpdatedAt
					})

					if (persistedQuery.queryKey.at(0) === "useDriveItemsQuery") {
						for (const item of (persistedQuery.state.data as DriveItem[]).filter(item => item.type === "directory")) {
							cacheMap.directoryUuidToDirEnum.set(item.data.uuid, item.data)
							cacheMap.directoryUuidToName.set(item.data.uuid, item.data.meta?.name ?? item.data.uuid)
						}
					}

					if (persistedQuery.queryKey.at(0) === "useNotesQuery") {
						for (const note of persistedQuery.state.data as Note[]) {
							cacheMap.noteUuidToNote.set(note.uuid, note)
						}
					}
				}
			})
		)
	} catch (e) {
		console.error(e)
	}
}

export const DEFAULT_QUERY_OPTIONS: Pick<
	UseQueryOptions,
	| "refetchOnMount"
	| "refetchOnReconnect"
	| "refetchOnWindowFocus"
	| "staleTime"
	| "gcTime"
	| "refetchInterval"
	| "throwOnError"
	| "retryOnMount"
	| "experimental_prefetchInRender"
	| "refetchIntervalInBackground"
	| "retry"
	| "retryDelay"
> = {
	refetchOnMount: "always",
	refetchOnReconnect: "always",
	refetchOnWindowFocus: "always",
	staleTime: 0,
	gcTime: QUERY_CLIENT_CACHE_TIME,
	refetchInterval: false,
	experimental_prefetchInRender: true,
	refetchIntervalInBackground: false,
	retry: true,
	retryDelay: 1000,
	retryOnMount: true,
	throwOnError(err) {
		console.error(err)

		return false
	}
} as const

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			...DEFAULT_QUERY_OPTIONS,
			queryKeyHashFn: queryKey => pack(queryKey).toString("base64")
		}
	}
})

export default queryClient
