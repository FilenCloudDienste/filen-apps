import { memo, useEffect, useRef, useCallback } from "react"
import { useSdk } from "@/lib/sdk"
import type { EventListenerHandle } from "@filen/sdk-rs"
import Semaphore from "@/lib/semaphore"
import toasts from "@/lib/toasts"
import { notesQueryRefetch } from "@/queries/useNotes.query"
import { noteContentQueryRefetch } from "@/queries/useNoteContent.query"
import { contactRequestsQueryRefetch } from "@/queries/useContactRequests.query"

const registerMutex: Semaphore = new Semaphore(1)
const handleEventMutex: Semaphore = new Semaphore(1)

export const Socket = memo(() => {
	const sdk = useSdk()
	const listenerRef = useRef<EventListenerHandle | undefined>(undefined)

	const registerListener = useCallback(async () => {
		await registerMutex.acquire()

		try {
			if (listenerRef.current || !sdk) {
				return
			}

			listenerRef.current = await sdk.addSocketListener(null, async e => {
				await handleEventMutex.acquire()

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
				} finally {
					handleEventMutex.release()
				}
			})
		} catch (e) {
			console.error(e)
			toasts.error(e)
		} finally {
			registerMutex.release()
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
