import {
	ACTIVE_SESSION_KEY_LOCAL_STORAGE,
	type ActiveSessionLocalStorage,
	SESSIONS_KEY_SQLITE,
	type SessionSqlite
} from "@/services/auth.service"
import { useSqlite } from "./useSqlite"
import { useLocalStorage } from "@uidotdev/usehooks"
import { useMemo } from "react"
import type { StringifiedClient } from "@filen/sdk-rs"

export type UseAuth =
	| {
			authed: false
	  }
	| {
			authed: true
			client: StringifiedClient
	  }

export function useAuth(): UseAuth {
	const [activeSession] = useLocalStorage<ActiveSessionLocalStorage>(ACTIVE_SESSION_KEY_LOCAL_STORAGE)
	const [sessions] = useSqlite<SessionSqlite[]>(SESSIONS_KEY_SQLITE, [])

	const state = useMemo((): UseAuth => {
		if (!activeSession) {
			return {
				authed: false
			}
		}

		const session = sessions.find(session => session.rootUuid === activeSession.rootUuid)

		if (!session) {
			return {
				authed: false
			}
		}

		return {
			authed: true,
			client: session.client
		}
	}, [activeSession, sessions])

	return state
}
