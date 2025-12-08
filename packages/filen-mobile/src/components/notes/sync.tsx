import { useEffect } from "react"
import { run, Semaphore, createExecutableTimeout } from "@filen/utils"
import notes from "@/lib/notes"
import alerts from "@/lib/alerts"
import { AppState } from "react-native"
import useNotesStore, { type TemporaryContent } from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import sqlite from "@/lib/sqlite"
import { memo } from "@/lib/memo"

export class Sync {
	private readonly mutex: Semaphore = new Semaphore(1)
	private readonly storageMutex: Semaphore = new Semaphore(1)
	private syncTimeout: ReturnType<typeof createExecutableTimeout> | null = null
	public readonly sqliteKvKey: string = "temporaryNoteContents"
	private initDone: boolean = false

	public constructor() {
		this.restoreFromDisk()
	}

	private async waitForInit(): Promise<void> {
		while (!this.initDone) {
			await new Promise<void>(resolve => setTimeout(resolve, 100))
		}
	}

	private async restoreFromDisk() {
		const result = await run(async defer => {
			await Promise.all([this.mutex.acquire(), this.storageMutex.acquire()])

			defer(() => {
				this.mutex.release()
				this.storageMutex.release()
			})

			const [fromDisk, fromCloud] = await Promise.all([sqlite.kvAsync.get<TemporaryContent>(this.sqliteKvKey), notes.list()])

			console.log("fromDisk", fromDisk)

			if (!fromDisk || Object.keys(fromDisk).length === 0) {
				return
			}

			const fromCloudEditedTimestamp: Record<string, number> = fromCloud.reduce(
				(acc, note) => {
					acc[note.uuid] = Number(note.editedTimestamp)

					return acc
				},
				{} as Record<string, number>
			)

			for (const noteUuid of Object.keys(fromDisk)) {
				useNotesStore.getState().setTemporaryContent(prev => {
					const updated = {
						...prev
					}

					// If the note no longer exists in the cloud, remove its temporary contents
					if (!fromCloudEditedTimestamp[noteUuid]) {
						delete updated[noteUuid]
					} else {
						const editedTimestamp = fromCloudEditedTimestamp[noteUuid]

						for (const [uuid, contents] of Object.entries(updated)) {
							if (noteUuid === uuid) {
								// Remove any contents that are older than the cloud note's edited timestamp
								updated[noteUuid] = contents.filter(c => c.timestamp > editedTimestamp)
							}

							if (updated[noteUuid] && updated[noteUuid].length === 0) {
								delete updated[noteUuid]
							}
						}
					}

					return updated
				})
			}

			useNotesStore.setState({
				temporaryContent: fromDisk
			})
		})

		if (!result.success) {
			console.error("Error initializing note sync:", result.error)
		}

		// We don't really care if it failed, we just proceed
		this.initDone = true
	}

	public async flushToDisk(temporaryContent: TemporaryContent, requireMutex: boolean = true): Promise<void> {
		const result = await run(async defer => {
			await Promise.all([!requireMutex ? Promise.resolve() : this.storageMutex.acquire(), this.waitForInit()])

			defer(() => {
				if (requireMutex) {
					this.storageMutex.release()
				}
			})

			if (Object.keys(temporaryContent).length === 0) {
				await sqlite.kvAsync.remove(this.sqliteKvKey)

				console.log("Flushed note sync to disk (deleted)", 0)

				return
			}

			await sqlite.kvAsync.set(this.sqliteKvKey, temporaryContent)

			console.log("Flushed note sync to disk", Object.keys(temporaryContent).length)
		})

		if (!result.success) {
			console.error("Error flushing note sync to disk:", result.error)
		}

		console.log("temp", await sqlite.kvAsync.get<TemporaryContent>(this.sqliteKvKey))
	}

	private async sync(): Promise<void> {
		const result = await run(async defer => {
			await Promise.all([this.mutex.acquire(), this.waitForInit(), this.storageMutex.acquire()])

			defer(() => {
				this.mutex.release()
				this.storageMutex.release()
			})

			const fromDisk = await sqlite.kvAsync.get<TemporaryContent>(this.sqliteKvKey)

			if (!fromDisk || Object.keys(fromDisk).length === 0) {
				return
			}

			await Promise.all(
				Object.entries(fromDisk).map(async ([_, contents]) => {
					if (contents.length === 0) {
						return
					}

					const mostRecentContent = contents.sort((a, b) => b.timestamp - a.timestamp).at(0)

					if (!mostRecentContent) {
						return
					}

					const updatedNote = await notes.setContent({
						note: mostRecentContent.note,
						content: mostRecentContent.content
					})

					let didFlushToDisk = false

					useNotesStore.getState().setTemporaryContent(prev => {
						const updated = {
							...prev
						}

						for (const [noteUuid, contents] of Object.entries(updated)) {
							if (noteUuid === mostRecentContent.note.uuid) {
								// Remove contents that have been synced
								updated[noteUuid] = contents.filter(c => c.timestamp > Number(updatedNote.editedTimestamp))
							}

							if (updated[noteUuid] && updated[noteUuid].length === 0) {
								delete updated[noteUuid]
							}
						}

						console.log(updated)

						this.flushToDisk(updated, false)
							.then(() => {
								didFlushToDisk = true
							})
							.catch(console.error)

						return updated
					})

					while (!didFlushToDisk) {
						await new Promise<void>(resolve => setTimeout(resolve, 100))
					}
				})
			)
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}

		console.log("Sync completed")
	}

	public syncDebounced(): void {
		this.syncTimeout?.cancel()

		this.syncTimeout = createExecutableTimeout(() => {
			this.sync().catch(console.error)
		}, 3000)
	}

	public executeNow(): void {
		this.syncTimeout?.execute()
	}
}

export const sync = new Sync()

export const SyncHost = memo(() => {
	const temporaryContent = useNotesStore(useShallow(state => state.temporaryContent))

	useEffect(() => {
		const appStateListener = AppState.addEventListener("change", nextAppState => {
			if (nextAppState === "background") {
				sync.executeNow()
			}
		})

		return () => {
			appStateListener.remove()
		}
	}, [])

	useEffect(() => {
		if (Object.keys(temporaryContent).length === 0) {
			return
		}

		sync.flushToDisk(temporaryContent)
			.then(() => {
				sync.syncDebounced()
			})
			.catch(console.error)
	}, [temporaryContent])

	return null
})

export default SyncHost
