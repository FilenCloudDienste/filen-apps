import { SQLocalKysely } from "sqlocal/kysely"
import { Kysely, type Generated, sql } from "kysely"
import Semaphore from "./semaphore"
import events from "./events"
import cacheMap from "@/lib/cacheMap"
import { unpack, pack } from "msgpackr"
import { QUERY_CLIENT_PERSISTER_PREFIX } from "@/queries/persister"

export type DB = {
	kv: {
		id: Generated<number>
		key: string
		value: Uint8Array
	}
}

export const VERSION = 1

export class Sqlite {
	public readonly db: Kysely<DB>
	private readonly initMutex: Semaphore = new Semaphore(1)
	private initDone: boolean = false

	public constructor() {
		const { dialect } = new SQLocalKysely(`filen_web_v${VERSION}.sqlite3`)

		this.db = new Kysely<DB>({
			dialect
		})
	}

	public async init(): Promise<void> {
		await this.initMutex.acquire()

		try {
			if (this.initDone) {
				return
			}

			await sql`
                PRAGMA journal_mode = WAL;
                PRAGMA synchronous = NORMAL; 
                PRAGMA temp_store = MEMORY;
                PRAGMA mmap_size = 30000000;
                PRAGMA cache_size = -10000;
                PRAGMA foreign_keys = ON;
                PRAGMA busy_timeout = 60000;
                PRAGMA page_size = 4096;
                PRAGMA analysis_limit = 1000;
                PRAGMA auto_vacuum = INCREMENTAL;
                PRAGMA optimize;
                PRAGMA encoding = "UTF-8";
                PRAGMA legacy_file_format = OFF;
                PRAGMA secure_delete = OFF;
            `.execute(this.db)

			await Promise.all([
				this.db.schema
					.createTable("kv")
					.ifNotExists()
					.addColumn("id", "integer", col => col.primaryKey().autoIncrement().unique())
					.addColumn("key", "text", col => col.notNull().unique())
					.addColumn("value", "binary", col => col.notNull())
					.execute()
			])

			await Promise.all([this.db.schema.createIndex("idx_kv_key").ifNotExists().on("kv").column("key").execute()])

			await this.initKv()

			this.initDone = true

			console.log("Sqlite initialized!")
		} finally {
			this.initMutex.release()
		}
	}

	private async initKv(): Promise<void> {
		const rows = await sqlite.db.selectFrom("kv").select(["key", "value"]).execute()

		for (const row of rows) {
			if (row.key.startsWith(QUERY_CLIENT_PERSISTER_PREFIX)) {
				continue
			}

			const parsed = unpack(row.value)

			cacheMap.kv.set(row.key, parsed)

			events.emit("kvChange", {
				key: row.key,
				value: parsed
			})
		}
	}

	public async waitForInit(): Promise<void> {
		while (!this.initDone) {
			await this.init()
		}
	}

	public async clear(): Promise<void> {
		await this.waitForInit()

		await sqlite.db.deleteFrom("kv").execute()

		cacheMap.kv.clear()

		events.emit("kvClear")
	}

	public kv = {
		get: async <T>(key: string): Promise<T | null> => {
			await this.waitForInit()

			const rows = await sqlite.db.selectFrom("kv").select("value").where("key", "=", key).execute()
			const row = rows[0]

			if (!row) {
				return null
			}

			const parsed = unpack(row.value)

			cacheMap.kv.set(key, parsed)

			return parsed as T
		},
		set: async (key: string, value: unknown): Promise<void> => {
			await this.waitForInit()

			await sqlite.db
				.insertInto("kv")
				.orReplace()
				.values({
					key,
					value: pack(value)
				})
				.execute()

			cacheMap.kv.set(key, value)

			events.emit("kvChange", {
				key,
				value
			})
		},
		delete: async (key: string): Promise<void> => {
			await this.waitForInit()

			await sqlite.db.deleteFrom("kv").where("key", "=", key).execute()

			cacheMap.kv.delete(key)

			events.emit("kvDelete", {
				key
			})
		},
		keys: async (): Promise<string[]> => {
			await this.waitForInit()

			const rows = await sqlite.db.selectFrom("kv").select("key").execute()

			return rows.map(row => row.key)
		},
		clear: async (): Promise<void> => {
			await this.waitForInit()

			await sqlite.db.deleteFrom("kv").execute()

			cacheMap.kv.clear()

			events.emit("kvClear")
		},
		contains: async (key: string): Promise<boolean> => {
			await this.waitForInit()

			return (await this.kv.get(key)) !== null
		}
	}
}

export const sqlite = new Sqlite()

export default sqlite
