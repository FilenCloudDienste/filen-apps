import { inputPrompt } from "@/components/prompts/input"
import worker from "@/lib/worker"
import type { NoteType, Note, NoteTag, Contact, NoteHistory } from "@filen/sdk-rs"
import { notesQueryUpdate } from "@/queries/useNotes.query"
import { noteContentQueryUpdate } from "@/queries/useNoteContent.query"
import { sanitizeFileName, createNotePreviewFromContentText } from "./utils"
import { notesTagsQueryUpdate } from "@/queries/useNotesTags.query"
import { selectContactPrompt } from "@/components/prompts/selectContact"
import { confirmPrompt } from "@/components/prompts/confirm"

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

						notesQueryUpdate({
							updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
						})

						noteContentQueryUpdate({
							note,
							updater: () => ""
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

	public async edit(note: Note, content: string, updateNoteContentQuery: boolean = true): Promise<Note> {
		note = await worker.sdk("setNoteContent", note, content, createNotePreviewFromContentText(note.noteType, content))

		if (updateNoteContentQuery) {
			notesQueryUpdate({
				updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
			})

			noteContentQueryUpdate({
				note,
				updater: () => content
			})
		}

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

						notesQueryUpdate({
							updater: prev => prev.filter(n => n.uuid !== note.uuid)
						})

						noteContentQueryUpdate({
							note,
							updater: () => undefined
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
					minLength: 1
				},
				cancelText: "tbd",
				confirmText: "tbd",
				async onSubmit(value) {
					try {
						note = await worker.sdk("setNoteTitle", note, value)

						notesQueryUpdate({
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

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== duplicated.uuid), duplicated]
		})

		noteContentQueryUpdate({
			note: duplicated,
			updater: () => content
		})

		return duplicated
	}

	public async archive(note: Note): Promise<Note> {
		note = await worker.sdk("archiveNote", note)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async trash(note: Note): Promise<Note> {
		note = await worker.sdk("trashNote", note)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async restore(note: Note): Promise<Note> {
		note = await worker.sdk("restoreNote", note)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async setType(note: Note, type: NoteType): Promise<Note> {
		const content = await worker.sdk("getNoteContent", note)

		note = await worker.sdk("setNoteType", note, type, content)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		noteContentQueryUpdate({
			note,
			updater: () => content
		})

		return note
	}

	public async pin(note: Note, pinned: boolean): Promise<Note> {
		note = await worker.sdk("setNotePinned", note, pinned)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async favorite(note: Note, favorite: boolean): Promise<Note> {
		note = await worker.sdk("setNoteFavorited", note, favorite)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async tag(note: Note, tag: NoteTag): Promise<Note> {
		const exists = note.tags.some(t => t.uuid === tag.uuid)

		if (!exists) {
			const result = await worker.sdk("addTagToNote", note, tag)

			note = result[0]
		} else {
			note = await worker.sdk("removeTagFromNote", note, tag)
		}

		notesQueryUpdate({
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

						notesQueryUpdate({
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

	public async removeParticipants(note: Note, contacts: Contact[]): Promise<Note> {
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
							contacts.map(async contact => {
								note = await worker.sdk("removeNoteParticipant", note, contact)
							})
						)

						notesQueryUpdate({
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
		contacts: {
			contact: Contact
			write: boolean
		}[]
	): Promise<Note> {
		await Promise.all(
			contacts.map(async ({ contact, write }) => {
				note = await worker.sdk("setNoteParticipantPermission", note, contact, write)
			})
		)

		notesQueryUpdate({
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
				confirmDestructive: true,
				async onSubmit() {
					try {
						note = await worker.sdk("restoreNoteFromHistory", note, history)

						notesQueryUpdate({
							updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
						})

						noteContentQueryUpdate({
							note,
							updater: () => history.content
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

	public async leave(note: Note, myUserId: number): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: "tbd",
				description: "tbd",
				cancelText: "tbd",
				confirmText: "tbd",
				confirmDestructive: true,
				async onSubmit() {
					try {
						await worker.sdk("removeNoteParticipant", note, {
							uuid: "",
							userId: BigInt(myUserId),
							email: "",
							nickName: "",
							lastActive: BigInt(0),
							timestamp: BigInt(0),
							publicKey: ""
						} satisfies Contact)

						notesQueryUpdate({
							updater: prev => prev.filter(n => n.uuid !== note.uuid)
						})

						noteContentQueryUpdate({
							note,
							updater: () => undefined
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

							notesTagsQueryUpdate({
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

							notesTagsQueryUpdate({
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
						minLength: 1
					},
					cancelText: "tbd",
					confirmText: "tbd",
					async onSubmit(value) {
						try {
							tag = await worker.sdk("renameNoteTag", tag, value)

							notesTagsQueryUpdate({
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

			notesTagsQueryUpdate({
				updater: prev => [...prev.filter(t => t.uuid !== tag.uuid), tag]
			})

			return tag
		}
	}
}

export const notes = new Notes()

export default notes
