import queryClientPersisterKv, { QUERY_CLIENT_PERSISTER_PREFIX } from "./persister"
import { experimental_createQueryPersister, type PersistedQuery } from "@tanstack/query-persist-client-core"
import { QueryClient, type UseQueryOptions } from "@tanstack/react-query"
import type { DriveItem } from "./useDriveItems.query"
import cacheMap from "@/lib/cacheMap"

export const UNCACHED_QUERY_KEYS: string[] = []
export const CACHE_TIME: number = 86400 * 1000 * 365

export const shouldPersistQuery = (queryKey: unknown[]) => {
	const shouldNotPersist = queryKey.some(queryKey => typeof queryKey === "string" && UNCACHED_QUERY_KEYS.includes(queryKey))

	return !shouldNotPersist
}

export const queryClientPersister = experimental_createQueryPersister({
	storage: queryClientPersisterKv,
	maxAge: CACHE_TIME,
	buster: "",
	serialize: query => {
		if (query.state.status !== "success" || !shouldPersistQuery(query.queryKey as unknown[])) {
			return undefined
		}

		return query
	},
	deserialize: query => query as PersistedQuery,
	prefix: QUERY_CLIENT_PERSISTER_PREFIX
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
	refetchOnMount: true,
	refetchOnReconnect: true,
	refetchOnWindowFocus: true,
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
			persister: queryClientPersister.persisterFn
		}
	}
})

export async function restoreQueries(): Promise<void> {
	const keys = await queryClientPersisterKv.keys()

	await Promise.all(
		keys.map(async key => {
			if (key.startsWith(QUERY_CLIENT_PERSISTER_PREFIX)) {
				const persistedQuery = (await queryClientPersisterKv.getItem(key)) as unknown as PersistedQuery

				if (!persistedQuery || !persistedQuery.state) {
					await queryClientPersisterKv.removeItem(key)

					return
				}

				const shouldNotPersist = !shouldPersistQuery(persistedQuery.queryKey as unknown[])

				if (persistedQuery.state.dataUpdatedAt + CACHE_TIME < Date.now()) {
					await queryClientPersisterKv.removeItem(key)

					return
				}

				if (persistedQuery.state.status === "success") {
					if (!shouldNotPersist) {
						queryClient.setQueryData(persistedQuery.queryKey, persistedQuery.state.data, {
							updatedAt: persistedQuery.state.dataUpdatedAt
						})

						if (persistedQuery.queryKey.at(0) === "useDriveItemsQuery") {
							for (const item of (persistedQuery.state.data as DriveItem[]).filter(item => item.type === "directory")) {
								cacheMap.directoryUUIDToDirEnum.set(item.data.uuid, item.data)
								cacheMap.directoryUUIDToName.set(item.data.uuid, item.data.meta?.name ?? item.data.uuid)
							}
						}
					} else {
						await queryClientPersisterKv.removeItem(key)
					}
				}
			}
		})
	)
}

export default queryClient
