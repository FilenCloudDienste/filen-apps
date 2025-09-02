import Dexie, { type Table } from "dexie"
import cacheMap from "./cacheMap"
import { QUERY_CLIENT_PERSISTER_PREFIX } from "@/queries/persister"
import { unpack, pack } from "msgpackr"
import events from "./events"
import Semaphore from "./semaphore"

export const VERSION = 1

export type KeyValueItem = {
	key: string
	value: Buffer
}

export class FilenDatabase extends Dexie {
	public readonly kvStore!: Table<KeyValueItem, string>

	constructor() {
		super("filen")

		this.version(VERSION).stores({
			kvStore: "key"
		})
	}
}

export class Idb {
	private readonly db: FilenDatabase = new FilenDatabase()
	private initDone: boolean = false
	private readonly initMutex: Semaphore = new Semaphore(1)

	private async init(): Promise<void> {
		await this.initMutex.acquire()

		try {
			await this.db.open()

			const entries = await this.db.kvStore.toArray()

			await Promise.all(
				entries.map(async ({ key, value }) => {
					if (key.startsWith(QUERY_CLIENT_PERSISTER_PREFIX)) {
						return
					}

					const parsed = unpack(value)

					cacheMap.kv.set(key, parsed)

					events.emit("kvChange", {
						key,
						value: parsed
					})
				})
			)

			this.initDone = true
		} finally {
			this.initMutex.release()
		}
	}

	public async waitForInit(): Promise<void> {
		while (!this.initDone) {
			await this.init()
		}
	}

	public async clear(): Promise<void> {
		await this.waitForInit()

		await this.db.kvStore.clear()

		cacheMap.kv.clear()

		events.emit("kvClear")
	}

	public async get<T>(key: string): Promise<T | null> {
		await this.waitForInit()

		const item = await this.db.kvStore.get(key)

		if (!item) {
			return null
		}

		const parsed = unpack(item.value)

		cacheMap.kv.set(key, parsed)

		return parsed as T
	}

	public async set(key: string, value: unknown): Promise<void> {
		await this.waitForInit()

		await this.db.kvStore.put({
			key,
			value: pack(value)
		})

		cacheMap.kv.set(key, value)

		events.emit("kvChange", {
			key,
			value
		})
	}

	public async remove(key: string): Promise<void> {
		await this.waitForInit()

		await this.db.kvStore.delete(key)

		cacheMap.kv.delete(key)

		events.emit("kvDelete", {
			key
		})
	}

	public async keys(): Promise<string[]> {
		await this.waitForInit()

		return (await this.db.kvStore.orderBy("key").keys()) as string[]
	}

	public async contains(key: string): Promise<boolean> {
		await this.waitForInit()

		const count = await this.db.kvStore.where("key").equals(key).count()

		return count > 0
	}

	public async entries<T>(): Promise<[string, T][]> {
		await this.waitForInit()

		const items = await this.db.kvStore.toArray()

		return items.map(({ key, value }) => {
			return [key, unpack(value) as T]
		})
	}

	public async values<T>(): Promise<T[]> {
		await this.waitForInit()

		const items = await this.db.kvStore.toArray()

		return items.map(({ value }) => {
			return unpack(value) as T
		})
	}

	public async getKeysByPrefix(prefix: string): Promise<string[]> {
		await this.waitForInit()

		return (await this.db.kvStore.where("key").startsWith(prefix).keys()) as string[]
	}

	public async getEntriesByPrefix<T>(prefix: string): Promise<[string, T][]> {
		await this.waitForInit()

		const items = await this.db.kvStore.where("key").startsWith(prefix).toArray()

		return items.map(({ key, value }) => {
			return [key, unpack(value) as T]
		})
	}

	public async removeByPrefix(prefix: string): Promise<void> {
		await this.waitForInit()

		const keysToDelete = (await this.db.kvStore.where("key").startsWith(prefix).keys()) as string[]

		await this.db.kvStore.where("key").startsWith(prefix).delete()

		for (const key of keysToDelete) {
			cacheMap.kv.delete(key)

			events.emit("kvDelete", {
				key
			})
		}
	}

	public async getKeysInRange(startKey: string, endKey: string): Promise<string[]> {
		await this.waitForInit()

		return (await this.db.kvStore.where("key").between(startKey, endKey, true, true).keys()) as string[]
	}

	public async countByPrefix(prefix: string): Promise<number> {
		await this.waitForInit()

		return await this.db.kvStore.where("key").startsWith(prefix).count()
	}
}

export const idb = new Idb()

export default idb
