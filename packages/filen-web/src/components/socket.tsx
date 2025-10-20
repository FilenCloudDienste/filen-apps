import { memo, useEffect, useRef, useCallback } from "react"
import { useSdk } from "@/lib/sdk"
import type { EventListenerHandle } from "@filen/sdk-rs"
import toasts from "@/lib/toasts"
import { notesQueryRefetch } from "@/queries/useNotes.query"
import { noteContentQueryRefetch } from "@/queries/useNoteContent.query"
import { contactRequestsQueryRefetch } from "@/queries/useContactRequests.query"

export const Socket = memo(() => {
	const sdk = useSdk()
	const listenerRef = useRef<EventListenerHandle | undefined>(undefined)

	const registerListener = useCallback(async () => {
		if (listenerRef.current || !sdk) {
			return
		}

		try {
			listenerRef.current = await sdk.addSocketListener(null, async e => {
				try {
					switch (e.type) {
						case "noteNew":
						case "noteArchived":
						case "noteDeleted":
						case "noteParticipantNew":
						case "noteRestored":
						case "noteParticipantRemoved":
						case "noteTitleEdited":
						case "noteParticipantPermissions": {
							await notesQueryRefetch()

							return
						}

						case "noteContentEdited": {
							await noteContentQueryRefetch({
								uuid: e.data.note
							})

							return
						}

						case "contactRequestReceived": {
							await contactRequestsQueryRefetch()

							return
						}
					}
				} catch (e) {
					console.error(e)
					toasts.error(e)
				}
			})
		} catch (e) {
			console.error(e)
			toasts.error(e)
		}
	}, [sdk])

	useEffect(() => {
		registerListener()

		return () => {
			listenerRef.current?.free()
			listenerRef.current = undefined
		}
	}, [registerListener])

	return null
})

Socket.displayName = "Socket"

export default Socket
