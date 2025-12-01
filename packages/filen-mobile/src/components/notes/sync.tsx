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
	private flushTimeout: ReturnType<typeof createExecutableTimeout> | null = null

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

			if (!fromDisk) {
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

	private async flushToDisk(temporaryContent?: TemporaryContent): Promise<void> {
		const result = await run(async defer => {
			await Promise.all([this.storageMutex.acquire(), this.waitForInit()])

			defer(() => {
				this.storageMutex.release()
			})

			await sqlite.kvAsync.set(this.sqliteKvKey, temporaryContent ?? useNotesStore.getState().temporaryContent)
		})

		if (!result.success) {
			console.error("Error flushing note sync to disk:", result.error)
		}
	}

	public flushToDiskDebounced(temporaryContent?: TemporaryContent): void {
		this.flushTimeout?.cancel()

		this.flushTimeout = createExecutableTimeout(() => {
			this.flushToDisk(temporaryContent).catch(console.error)
		}, 3000)
	}

	private async sync(temporaryContent?: TemporaryContent): Promise<void> {
		const result = await run(async defer => {
			await Promise.all([this.mutex.acquire(), this.waitForInit()])

			defer(() => {
				this.mutex.release()
			})

			await Promise.all(
				Object.entries(temporaryContent ?? useNotesStore.getState().temporaryContent).map(async ([_, contents]) => {
					if (contents.length === 0) {
						return
					}

					const mostRecentContent = contents.sort((a, b) => b.timestamp - a.timestamp).at(0)

					if (!mostRecentContent) {
						return
					}

					await notes.setContent({
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
								updated[noteUuid] = contents.filter(c => c.timestamp > mostRecentContent.timestamp)
							}

							if (updated[noteUuid] && updated[noteUuid].length === 0) {
								delete updated[noteUuid]
							}
						}

						this.flushToDisk(updated)
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
	}

	public syncDebounced(temporaryContent?: TemporaryContent): void {
		this.syncTimeout?.cancel()

		this.syncTimeout = createExecutableTimeout(() => {
			this.sync(temporaryContent).catch(console.error)
		}, 3000)
	}

	public executeNow(): void {
		this.syncTimeout?.execute()
		this.flushTimeout?.execute()
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

		sync.flushToDiskDebounced(temporaryContent)
		sync.syncDebounced(temporaryContent)
	}, [temporaryContent])

	return null
})

export default SyncHost
