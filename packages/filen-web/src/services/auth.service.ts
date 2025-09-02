import { type StringifiedClient } from "@filen/sdk-rs"
import idb from "@/lib/idb"
import worker from "@/lib/worker"

export type ActiveSessionLocalStorage = {
	rootUuid: string
	email: string
	avatar?: string
}

export type SessionIdb = {
	rootUuid: string
	client: StringifiedClient
}

export const SESSIONS_KEY_IDB: string = "sessions"
export const ACTIVE_SESSION_KEY_LOCAL_STORAGE: string = "activeSession"

export class AuthService {
	public getActiveSession(): ActiveSessionLocalStorage | null {
		return JSON.parse(globalThis.localStorage.getItem(ACTIVE_SESSION_KEY_LOCAL_STORAGE) || "null")
	}

	public async isAuthed(): Promise<boolean> {
		const activeSession = this.getActiveSession()

		if (!activeSession) {
			return false
		}

		const storedSessions = (await idb.get<SessionIdb[]>(SESSIONS_KEY_IDB)) ?? []

		if (storedSessions.length === 0) {
			return false
		}

		const session = storedSessions.some(session => session.rootUuid === activeSession.rootUuid)

		if (!session) {
			return false
		}

		return true
	}

	public async getClient(): Promise<StringifiedClient | null> {
		const activeSession = this.getActiveSession()

		if (!activeSession) {
			return null
		}

		const storedSessions = (await idb.get<SessionIdb[]>(SESSIONS_KEY_IDB)) ?? []

		if (storedSessions.length === 0) {
			return null
		}

		const session = storedSessions.filter(session => session.rootUuid === activeSession.rootUuid).at(0)

		if (!session) {
			return null
		}

		return session.client
	}

	public async login(...params: Parameters<typeof worker.direct.login>): Promise<void> {
		await worker.direct.login(...params)

		const client = await worker.direct.stringifyClient()

		if (!client) {
			throw new Error("Failed to get client after login.")
		}

		globalThis.localStorage.setItem(
			ACTIVE_SESSION_KEY_LOCAL_STORAGE,
			JSON.stringify({
				rootUuid: client.rootUuid,
				email: client.email,
				avatar: "" // TODO
			} satisfies ActiveSessionLocalStorage)
		)

		const storedSessions = (await idb.get<SessionIdb[]>(SESSIONS_KEY_IDB)) ?? []

		await idb.set(SESSIONS_KEY_IDB, [
			...storedSessions.filter(session => session.rootUuid !== client.rootUuid),
			{
				rootUuid: client.rootUuid,
				client
			} satisfies SessionIdb
		])
	}

	public async logout(): Promise<void> {
		await idb.clear()

		window.location.href = "/"
	}
}

export const authService = new AuthService()

export default authService
