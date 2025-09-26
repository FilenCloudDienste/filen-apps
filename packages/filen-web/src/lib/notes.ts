import { inputPrompt } from "@/components/prompts/input"
import worker from "@/lib/worker"
import type { NoteType, Note, NoteTag, Contact, NoteHistory, NoteParticipant } from "@filen/sdk-rs"
import { notesQueryUpdate } from "@/queries/useNotes.query"
import { noteContentQueryUpdate } from "@/queries/useNoteContent.query"
import { sanitizeFileName, createNotePreviewFromContentText } from "./utils"
import { notesTagsQueryUpdate } from "@/queries/useNotesTags.query"
import { selectContactPrompt } from "@/components/prompts/selectContact"
import { confirmPrompt } from "@/components/prompts/confirm"
import * as zip from "@zip.js/zip.js"
import { noteHistoryQueryRefetch } from "@/queries/useNoteHistory.query"

export class Notes {
	public async create(type?: NoteType): Promise<Note> {
		return await new Promise<Note>((resolve, reject) => {
			inputPrompt({
				title: "tbd",
				description: "tbd",
				inputProps: {
					type: "text",
					placeholder: "tbd",
					autoFocus: true,
					required: true,
					maxLength: 254,
					minLength: 1
				},
				cancelText: "tbd",
				confirmText: "tbd",
				async onSubmit(value) {
					try {
						let note = await worker.sdk("createNote", value)

						if (type && type !== note.noteType) {
							note = await worker.sdk("setNoteType", note, type, "")
						}

						await Promise.all([
							notesQueryUpdate({
								updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
							}),
							noteContentQueryUpdate({
								params: {
									uuid: note.uuid
								},
								updater: () => ""
							})
						])

						resolve(note)
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async setContent(note: Note, content: string): Promise<Note> {
		note = await worker.sdk("setNoteContent", note, content, createNotePreviewFromContentText(note.noteType, content))

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async delete(note: Note): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				confirmDestructive: true,
				async onSubmit() {
					try {
						await worker.sdk("deleteNote", note)

						await Promise.all([
							notesQueryUpdate({
								updater: prev => prev.filter(n => n.uuid !== note.uuid)
							}),
							noteContentQueryUpdate({
								params: {
									uuid: note.uuid
								},
								updater: () => undefined
							})
						])

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async rename(note: Note): Promise<Note> {
		return await new Promise<Note>((resolve, reject) => {
			inputPrompt({
				title: "tbd",
				description: "tbd",
				inputProps: {
					type: "text",
					placeholder: "tbd",
					autoFocus: true,
					required: true,
					maxLength: 254,
					minLength: 1,
					value: note.title ?? note.uuid
				},
				cancelText: "tbd",
				confirmText: "tbd",
				async onSubmit(value) {
					try {
						note = await worker.sdk("setNoteTitle", note, value)

						await notesQueryUpdate({
							updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
						})

						resolve(note)
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async duplicate(note: Note): Promise<Note> {
		const content = await worker.sdk("getNoteContent", note)
		const { duplicated } = await worker.sdk("duplicateNote", note)

		await Promise.all([
			notesQueryUpdate({
				updater: prev => [...prev.filter(n => n.uuid !== duplicated.uuid), duplicated]
			}),
			noteContentQueryUpdate({
				params: {
					uuid: duplicated.uuid
				},
				updater: () => content
			})
		])

		return duplicated
	}

	public async archive(note: Note): Promise<Note> {
		note = await worker.sdk("archiveNote", note)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async trash(note: Note): Promise<Note> {
		note = await worker.sdk("trashNote", note)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async restore(note: Note): Promise<Note> {
		note = await worker.sdk("restoreNote", note)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async setType(note: Note, type: NoteType): Promise<Note> {
		const content = await worker.sdk("getNoteContent", note)

		note = await worker.sdk("setNoteType", note, type, content)

		await Promise.all([
			notesQueryUpdate({
				updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
			}),
			noteContentQueryUpdate({
				params: {
					uuid: note.uuid
				},
				updater: () => content
			})
		])

		return note
	}

	public async pin(note: Note, pinned: boolean): Promise<Note> {
		note = await worker.sdk("setNotePinned", note, pinned)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async favorite(note: Note, favorite: boolean): Promise<Note> {
		note = await worker.sdk("setNoteFavorited", note, favorite)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async removeTag(note: Note, tag: NoteTag): Promise<Note> {
		note = await worker.sdk("removeTagFromNote", note, tag)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async addTag(note: Note, tag: NoteTag): Promise<Note> {
		const [noteEdited, tagEdited] = await worker.sdk("addTagToNote", note, tag)

		await Promise.all([
			notesQueryUpdate({
				updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
			}),
			notesTagsQueryUpdate({
				updater: prev => prev.map(t => (t.uuid === tag.uuid ? tagEdited : t))
			})
		])

		return noteEdited
	}

	public async tag(note: Note, tag: NoteTag): Promise<Note> {
		const exists = note.tags.some(t => t.uuid === tag.uuid)

		if (!exists) {
			const [noteEdited, tagEdited] = await worker.sdk("addTagToNote", note, tag)

			note = noteEdited

			await notesTagsQueryUpdate({
				updater: prev => prev.map(t => (t.uuid === tag.uuid ? tagEdited : t))
			})
		} else {
			note = await worker.sdk("removeTagFromNote", note, tag)
		}

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async export(note: Note): Promise<void> {
		const content = await worker.sdk("getNoteContent", note)

		const blob = new Blob([content ?? ""], {
			type: "text/plain"
		})

		const url = globalThis.window.URL.createObjectURL(blob)
		const a = document.createElement("a")

		a.href = url
		a.download = sanitizeFileName(`${sanitizeFileName(note.title ?? note.uuid)}.txt`)

		document.body.appendChild(a)

		a.click()

		document.body.removeChild(a)

		globalThis.window.URL.revokeObjectURL(url)
	}

	public async exportAll(): Promise<void> {
		const notes = await worker.sdk("listNotes")

		if (notes.length === 0) {
			return
		}

		const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"))

		await Promise.all(
			notes.map(async note => {
				const content = await worker.sdk("getNoteContent", note)

				await zipWriter.add(
					sanitizeFileName(`${sanitizeFileName(note.title ?? note.uuid)}_${note.uuid}.txt`),
					new zip.TextReader(content ?? "")
				)
			})
		)

		const blob = await zipWriter.close()

		const url = globalThis.window.URL.createObjectURL(blob)
		const a = document.createElement("a")

		a.href = url
		a.download = "tbd.zip"

		document.body.appendChild(a)

		a.click()

		document.body.removeChild(a)

		globalThis.window.URL.revokeObjectURL(url)
	}

	public async addParticipants(note: Note): Promise<Note> {
		return await new Promise<Note>((resolve, reject) => {
			selectContactPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				multiple: true,
				async onSubmit(contacts) {
					try {
						const selected = contacts
							.filter(c => c.type === "contact" && !note.participants.some(p => p.userId === c.userId))
							.map(c => c as Contact)

						await Promise.all(
							selected.map(async contact => {
								note = await worker.sdk("addNoteParticipant", note, contact, true)
							})
						)

						await notesQueryUpdate({
							updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
						})

						resolve(note)
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async removeParticipants(note: Note, participants: NoteParticipant[]): Promise<Note> {
		return await new Promise<Note>((resolve, reject) => {
			confirmPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				confirmDestructive: true,
				async onSubmit() {
					try {
						await Promise.all(
							participants.map(async participant => {
								note = await worker.sdk("removeNoteParticipant", note, participant.userId)
							})
						)

						await notesQueryUpdate({
							updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
						})

						resolve(note)
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async setParticipantsPermissions(
		note: Note,
		participants: {
			participant: NoteParticipant
			permissionsWrite: boolean
		}[]
	): Promise<Note> {
		await Promise.all(
			participants.map(async ({ participant, permissionsWrite }) => {
				const modifiedParticipant = await worker.sdk("setNoteParticipantPermission", note.uuid, participant, permissionsWrite)

				note = {
					...note,
					participants: note.participants.map(p => (p.userId === modifiedParticipant.userId ? modifiedParticipant : p))
				}
			})
		)

		await notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async restoreHistory(note: Note, history: NoteHistory): Promise<Note> {
		return await new Promise<Note>((resolve, reject) => {
			confirmPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				async onSubmit() {
					try {
						note = await worker.sdk("restoreNoteFromHistory", note, history)

						await Promise.all([
							notesQueryUpdate({
								updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
							}),
							noteContentQueryUpdate({
								params: {
									uuid: note.uuid
								},
								updater: () => history.content
							}),
							noteHistoryQueryRefetch({
								uuid: note.uuid
							})
						])

						resolve(note)
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async leave(note: Note, myUserId: bigint): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				confirmDestructive: true,
				async onSubmit() {
					try {
						await worker.sdk("removeNoteParticipant", note, myUserId)

						await Promise.all([
							notesQueryUpdate({
								updater: prev => prev.filter(n => n.uuid !== note.uuid)
							}),
							noteContentQueryUpdate({
								params: {
									uuid: note.uuid
								},
								updater: () => undefined
							})
						])

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public tags = {
		create: async (): Promise<NoteTag> => {
			return await new Promise<NoteTag>((resolve, reject) => {
				inputPrompt({
					title: "tbd",
					description: "tbd",
					inputProps: {
						type: "text",
						placeholder: "tbd",
						autoFocus: true,
						required: true,
						maxLength: 254,
						minLength: 1
					},
					cancelText: "tbd",
					confirmText: "tbd",
					async onSubmit(value) {
						try {
							const tag = await worker.sdk("createNoteTag", value)

							await notesTagsQueryUpdate({
								updater: prev => [...prev.filter(t => t.uuid !== tag.uuid), tag]
							})

							resolve(tag)
						} catch (e) {
							reject(e)
						}
					}
				})
					.then(response => {
						if (response.cancelled) {
							reject(new Error("Cancelled"))

							return
						}

						reject(new Error("onSubmit not called"))
					})
					.catch(reject)
			})
		},
		delete: async (tag: NoteTag): Promise<void> => {
			return await new Promise<void>((resolve, reject) => {
				confirmPrompt({
					title: "tbd",
					description: "tbd",
					cancelText: "tbd",
					confirmText: "tbd",
					confirmDestructive: true,
					async onSubmit() {
						try {
							await worker.sdk("deleteNoteTag", tag)

							await notesTagsQueryUpdate({
								updater: prev => prev.filter(t => t.uuid !== tag.uuid)
							})

							resolve()
						} catch (e) {
							reject(e)
						}
					}
				})
					.then(response => {
						if (response.cancelled) {
							reject(new Error("Cancelled"))

							return
						}

						reject(new Error("onSubmit not called"))
					})
					.catch(reject)
			})
		},
		rename: async (tag: NoteTag): Promise<NoteTag> => {
			return await new Promise<NoteTag>((resolve, reject) => {
				inputPrompt({
					title: "tbd",
					description: "tbd",
					inputProps: {
						type: "text",
						placeholder: "tbd",
						autoFocus: true,
						required: true,
						maxLength: 254,
						minLength: 1,
						value: tag.name
					},
					cancelText: "tbd",
					confirmText: "tbd",
					async onSubmit(value) {
						try {
							tag = await worker.sdk("renameNoteTag", tag, value)

							await notesTagsQueryUpdate({
								updater: prev => [...prev.filter(t => t.uuid !== tag.uuid), tag]
							})

							resolve(tag)
						} catch (e) {
							reject(e)
						}
					}
				})
					.then(response => {
						if (response.cancelled) {
							reject(new Error("Cancelled"))

							return
						}

						reject(new Error("onSubmit not called"))
					})
					.catch(reject)
			})
		},
		favorite: async (tag: NoteTag, favorite: boolean): Promise<NoteTag> => {
			tag = await worker.sdk("setNoteTagFavorited", tag, favorite)

			await notesTagsQueryUpdate({
				updater: prev => [...prev.filter(t => t.uuid !== tag.uuid), tag]
			})

			return tag
		}
	}
}

export const notes = new Notes()

export default notes
