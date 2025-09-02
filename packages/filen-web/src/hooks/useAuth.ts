import {
	ACTIVE_SESSION_KEY_LOCAL_STORAGE,
	type ActiveSessionLocalStorage,
	SESSIONS_KEY_IDB,
	type SessionIdb
} from "@/services/auth.service"
import useIdb from "./useIdb"
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
	const [sessions] = useIdb<SessionIdb[]>(SESSIONS_KEY_IDB, [])

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
