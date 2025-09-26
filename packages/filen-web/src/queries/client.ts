import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { QueryClient, type UseQueryOptions, type Query } from "@tanstack/react-query"
import { pack, unpack } from "msgpackr"
import type { DriveItem } from "./useDriveItems.query"
import cacheMap from "@/lib/cacheMap"
import type { Note } from "@filen/sdk-rs"
import idb from "@/lib/idb"

export const UNCACHED_QUERY_KEYS: string[] = ["thumbnailObjectUrl", "textPreviewQuery"]
export const CACHE_TIME: number = 86400 * 1000 * 365
export const VERSION: number = 1
export const QUERY_CLIENT_PERSISTER_PREFIX: string = `reactQuery_v${VERSION}`

export const shouldPersistQuery = (query: Query<unknown, Error, unknown, readonly unknown[]>): boolean => {
	const shouldNotPersist = (query.queryKey as unknown[]).some(
		queryKey => typeof queryKey === "string" && UNCACHED_QUERY_KEYS.includes(queryKey)
	)

	return !shouldNotPersist && query.state.status === "success"
}

export const queryClientPersister = createAsyncStoragePersister({
	storage: {
		getItem: async <T>(key: string): Promise<T | null> => {
			return await idb.get<T>(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
		},
		setItem: async (key: string, value: unknown): Promise<void> => {
			await idb.set(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`, value)
		},
		removeItem: async (key: string): Promise<void> => {
			return await idb.remove(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
		},
		entries: async (): Promise<Array<[string, string]>> => {
			const keys = await idb.getKeysByPrefix(QUERY_CLIENT_PERSISTER_PREFIX)

			const entries = await Promise.all(
				keys.map(async key => {
					const value = await idb.get(key)

					return [key.replace(`${QUERY_CLIENT_PERSISTER_PREFIX}-`, ""), value ?? ""] as [string, string]
				})
			)

			return entries.filter(([, value]) => value !== undefined) as Array<[string, string]>
		}
	},
	serialize: client => {
		return pack(client) as unknown as string
	},
	deserialize: client => {
		const unpacked = unpack(client as unknown as Buffer)
		const queries = unpacked?.clientState?.queries as Query[]

		if (queries && Array.isArray(queries) && queries.length > 0) {
			for (const query of queries) {
				if (query.state.status !== "success" || !query.state.data) {
					continue
				}

				if (query.queryKey.at(0) === "useDriveItemsQuery") {
					for (const item of (query.state.data as DriveItem[]).filter(item => item.type === "directory")) {
						cacheMap.directoryUuidToDirEnum.set(item.data.uuid, item.data)
						cacheMap.directoryUuidToName.set(item.data.uuid, item.data.meta?.name ?? item.data.uuid)
					}
				}

				if (query.queryKey.at(0) === "useNotesQuery") {
					for (const note of query.state.data as Note[]) {
						cacheMap.noteUuidToNote.set(note.uuid, note)
					}
				}
			}
		}

		return unpacked
	},
	key: QUERY_CLIENT_PERSISTER_PREFIX
})

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
	gcTime: CACHE_TIME,
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
