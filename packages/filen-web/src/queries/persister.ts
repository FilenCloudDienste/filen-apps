import sqlite from "@/lib/sqlite"

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
			return await sqlite.kv.get(`${QUERY_CLIENT_PERSISTER_PREFIX}:${key}`)
		},
		setItem: async (key: string, value: unknown): Promise<void> => {
			await sqlite.kv.set(`${QUERY_CLIENT_PERSISTER_PREFIX}:${key}`, value)
		},
		removeItem: async (key: string): Promise<void> => {
			return await sqlite.kv.delete(`${QUERY_CLIENT_PERSISTER_PREFIX}:${key}`)
		},
		keys: async (): Promise<string[]> => {
			return (await sqlite.kv.keys()).map(key => key.replace(`${QUERY_CLIENT_PERSISTER_PREFIX}:`, ""))
		},
		clear: async (): Promise<void> => {
			return sqlite.kv.clear()
		}
	}
}

export const queryClientPersisterKv = createKvPersister()

export default queryClientPersisterKv
