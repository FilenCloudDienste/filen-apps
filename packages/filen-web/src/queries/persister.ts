import idb from "@/lib/idb"

export const VERSION: number = 1
export const QUERY_CLIENT_PERSISTER_PREFIX: string = `reactQuery_v${VERSION}`

export function createKvPersister(): {
	getItem: <T>(key: string) => Promise<T | null>
	setItem: (key: string, value: unknown) => Promise<void>
	removeItem: (key: string) => Promise<void>
	keys: () => Promise<string[]>
	clear: () => Promise<void>
} {
	return {
		getItem: async <T>(key: string): Promise<T | null> => {
			return await idb.get<T>(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
		},
		setItem: async (key: string, value: unknown): Promise<void> => {
			await idb.set(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`, value)
		},
		removeItem: async (key: string): Promise<void> => {
			return await idb.remove(`${QUERY_CLIENT_PERSISTER_PREFIX}-${key}`)
		},
		keys: async (): Promise<string[]> => {
			return (await idb.getKeysByPrefix(QUERY_CLIENT_PERSISTER_PREFIX)).map(key =>
				key.replace(`${QUERY_CLIENT_PERSISTER_PREFIX}-`, "")
			)
		},
		clear: async (): Promise<void> => {
			const keys = await idb.getKeysByPrefix(QUERY_CLIENT_PERSISTER_PREFIX)

			await Promise.all(keys.map(idb.remove))
		}
	}
}

export const queryClientPersisterKv = createKvPersister()

export default queryClientPersisterKv
