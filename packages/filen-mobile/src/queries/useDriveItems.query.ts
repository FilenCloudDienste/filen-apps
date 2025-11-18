import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query"
import { DEFAULT_QUERY_OPTIONS, queryClient, useDefaultQueryParams, queryUpdater } from "@/queries/client"
import auth from "@/lib/auth"
import useRefreshOnFocus from "@/queries/useRefreshOnFocus"
import cache from "@/lib/cache"
import { sortParams } from "@filen/utils"
import { DirEnum, DirWithMetaEnum, AnyDirEnumWithShareInfo } from "@filen/sdk-rs"
import { Paths } from "expo-file-system"
import type { DrivePath } from "@/hooks/useDrivePath"
import { unwrapFileMeta, unwrapDirMeta } from "@/utils"
import type { DriveItem } from "@/types"

export type UseDriveItemsQueryParams = {
	path: DrivePath
	signal?: AbortSignal
}

export const BASE_QUERY_KEY = "useDriveItemsQuery"

export async function fetchData(params: UseDriveItemsQueryParams) {
	if (!params.path.type || !params.path.pathname) {
		return []
	}

	const parsedPath = Paths.parse(params.path.pathname)
	const sdkClient = await auth.getSdkClient()

	const signal = params.signal
		? {
				signal: params.signal
			}
		: undefined

	const result = await (() => {
		switch (params.path.type) {
			case "drive": {
				const dir = (() => {
					const root = new DirEnum.Root(sdkClient.root())

					if (parsedPath.base.length === 0 || parsedPath.base === "/" || parsedPath.base === ".") {
						return root
					}

					const cachedDir = cache.directoryUuidToDir.get(parsedPath.base)

					if (cachedDir) {
						return new DirEnum.Dir(cachedDir)
					}

					return root
				})()

				return sdkClient.listDir(dir, signal)
			}

			case "favorites": {
				return sdkClient.listFavorites(signal)
			}

			case "recents": {
				return sdkClient.listRecents(signal)
			}

			case "sharedIn": {
				const dir = (() => {
					if (parsedPath.base.length === 0 || parsedPath.base === "/" || parsedPath.base === ".") {
						return undefined
					}

					const cachedDir = cache.directoryUuidToDir.get(parsedPath.base)

					if (cachedDir) {
						return new DirWithMetaEnum.Dir(cachedDir)
					}

					return undefined
				})()

				return sdkClient.listInShared(dir, signal)
			}

			case "sharedOut": {
				const dir = (() => {
					if (parsedPath.base.length === 0 || parsedPath.base === "/" || parsedPath.base === ".") {
						return undefined
					}

					const cachedDir = cache.directoryUuidToDir.get(parsedPath.base)

					if (cachedDir) {
						return new DirWithMetaEnum.Dir(cachedDir)
					}

					return undefined
				})()

				return sdkClient.listOutShared(dir, params.path.contact, signal)
			}

			case "trash": {
				return null // TODO: fix when exported from sdk-rs
			}
		}
	})()

	if (!result) {
		return []
	}

	const items: DriveItem[] = []

	for (const resultDir of result.dirs) {
		const { meta, shared, dir, uuid, inner } = unwrapDirMeta(resultDir)

		if (!uuid || !inner) {
			continue
		}

		if (!shared) {
			items.push({
				type: "directory",
				data: {
					...dir,
					size: 0n,
					decryptedMeta: meta
				}
			})

			cache.directoryUuidToDir.set(uuid, dir)
			cache.directoryUuidToName.set(uuid, meta?.name ?? uuid)
			cache.directoryUuidToDirForSize.set(uuid, new AnyDirEnumWithShareInfo.Dir(dir))
		} else {
			items.push({
				type: "sharedDirectory",
				data: {
					...dir,
					size: 0n,
					decryptedMeta: meta,
					inner,
					uuid
				}
			})

			cache.sharedDirUuidToDir.set(uuid, dir)
			cache.sharedDirectoryUuidToName.set(uuid, meta?.name ?? uuid)
			cache.directoryUuidToDirForSize.set(uuid, new AnyDirEnumWithShareInfo.SharedDir(dir))
		}
	}

	for (const resultFile of result.files) {
		const { meta, shared, file } = unwrapFileMeta(resultFile)

		if (!shared) {
			items.push({
				type: "file",
				data: {
					...file,
					decryptedMeta: meta
				}
			})
		} else {
			items.push({
				type: "sharedFile",
				data: {
					...file,
					size: meta?.size ?? 0n,
					decryptedMeta: meta,
					uuid: file.file.uuid
				}
			})
		}
	}

	return items
}

export function useDriveItemsQuery(
	params: UseDriveItemsQueryParams,
	options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
): UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error> {
	const defaultParams = useDefaultQueryParams(options)
	const sortedParams = sortParams(params)

	const query = useQuery({
		...DEFAULT_QUERY_OPTIONS,
		...defaultParams,
		...options,
		queryKey: [BASE_QUERY_KEY, sortedParams],
		queryFn: ({ signal }) =>
			fetchData({
				...sortedParams,
				signal
			})
	})

	useRefreshOnFocus({
		isEnabled: query.isEnabled,
		refetch: query.refetch
	})

	return query as UseQueryResult<Awaited<ReturnType<typeof fetchData>>, Error>
}

export function driveItemsQueryUpdate({
	updater,
	params
}: {
	params: Parameters<typeof fetchData>[0]
} & {
	updater:
		| Awaited<ReturnType<typeof fetchData>>
		| ((prev: Awaited<ReturnType<typeof fetchData>>) => Awaited<ReturnType<typeof fetchData>>)
}): void {
	const sortedParams = sortParams(params)

	queryUpdater.set<Awaited<ReturnType<typeof fetchData>>>([BASE_QUERY_KEY, sortedParams], prev => {
		const currentData = prev ?? ([] satisfies Awaited<ReturnType<typeof fetchData>>)

		return typeof updater === "function" ? updater(currentData) : updater
	})
}

export async function driveItemsQueryRefetch(params: Parameters<typeof fetchData>[0]): Promise<void> {
	const sortedParams = sortParams(params)

	return await queryClient.refetchQueries({
		queryKey: [BASE_QUERY_KEY, sortedParams]
	})
}

export default useDriveItemsQuery
