import auth from "@/lib/auth"
import { type Note, NoteType, type NoteTag, type Contact, type NoteParticipant, type NoteHistory } from "@filen/sdk-rs"
import { noteContentQueryUpdate } from "@/queries/useNoteContent.query"
import { createNotePreviewFromContentText } from "@filen/utils"
import { notesQueryUpdate } from "@/queries/useNotes.query"
import { notesTagsQueryUpdate } from "@/queries/useNotesTags.query"

export class Notes {
	public async list(signal?: AbortSignal) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.listNotes(
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async listTags(signal?: AbortSignal) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.listNoteTags(
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async getContent({ note, signal }: { note: Note; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.getNoteContent(
			note,
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async setContent({
		note,
		content,
		signal,
		updateQuery
	}: {
		note: Note
		content: string
		signal?: AbortSignal
		updateQuery?: boolean
	}) {
		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.setNoteContent(
			note,
			content,
			createNotePreviewFromContentText(
				note.noteType === NoteType.Checklist ? "checklist" : note.noteType === NoteType.Rich ? "rich" : "other",
				content
			),
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		if (updateQuery) {
			noteContentQueryUpdate({
				params: {
					uuid: note.uuid
				},
				updater: content
			})
		}

		return note
	}

	public async setType({
		note,
		type,
		signal,
		knownContent
	}: {
		note: Note
		type: NoteType
		signal?: AbortSignal
		knownContent?: string
	}) {
		if (type === note.noteType) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.setNoteType(
			note,
			type,
			knownContent,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async setPinned({ note, pinned, signal }: { note: Note; pinned: boolean; signal?: AbortSignal }) {
		if (pinned === note.pinned) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.setNotePinned(
			note,
			pinned,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async setFavorited({ note, favorite, signal }: { note: Note; favorite: boolean; signal?: AbortSignal }) {
		if (favorite === note.favorite) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.setNoteFavorited(
			note,
			favorite,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async duplicate({ note, signal }: { note: Note; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()
		const { original, duplicated } = await sdkClient.duplicateNote(
			note,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== original.uuid && n.uuid !== duplicated.uuid), original, duplicated]
		})

		return {
			original,
			duplicated
		}
	}

	public async export({ note, signal }: { note: Note; signal?: AbortSignal }) {
		const content = await this.getContent({
			note,
			signal
		})

		// TODO

		return content
	}

	public async exportAll({ signal }: { signal?: AbortSignal }) {
		const notes = await this.list(signal)

		// TODO

		return notes
	}

	public async archive({ note, signal }: { note: Note; signal?: AbortSignal }) {
		if (note.archive) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.archiveNote(
			note,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async restore({ note, signal }: { note: Note; signal?: AbortSignal }) {
		if (!(note.trash || note.archive)) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.restoreNote(
			note,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async restoreFromHistory({ note, history, signal }: { note: Note; history: NoteHistory; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.restoreNoteFromHistory(
			note,
			history,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async trash({ note, signal }: { note: Note; signal?: AbortSignal }) {
		if (note.trash) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.trashNote(
			note,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async delete({ note, signal }: { note: Note; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		await sdkClient.deleteNote(
			note,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.filter(n => n.uuid !== note.uuid)
		})
	}

	public async setTitle({ note, newTitle, signal }: { note: Note; newTitle: string; signal?: AbortSignal }) {
		if (newTitle === note.title) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.setNoteTitle(
			note,
			newTitle,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async addTag({ note, tag, signal }: { note: Note; tag: NoteTag; signal?: AbortSignal }) {
		if (note.tags.find(t => t.uuid === tag.uuid)) {
			return
		}

		const sdkClient = await auth.getSdkClient()
		const { note: modifiedNote } = await sdkClient.addTagToNote(
			note,
			tag,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === modifiedNote.uuid ? modifiedNote : n))
		})

		return modifiedNote
	}

	public async removeTag({ note, tag, signal }: { note: Note; tag: NoteTag; signal?: AbortSignal }) {
		if (!note.tags.find(t => t.uuid === tag.uuid)) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.removeTagFromNote(
			note,
			tag,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async create({ title, content, type, signal }: { title: string; content: string; type: NoteType; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()
		const note = await sdkClient.createNote(
			title,
			signal
				? {
						signal
					}
				: undefined
		)

		await this.setType({
			note,
			type,
			signal,
			knownContent: content
		})

		await this.setContent({
			note,
			content,
			signal,
			updateQuery: true
		})

		notesQueryUpdate({
			updater: prev => [...prev.filter(n => n.uuid !== note.uuid), note]
		})

		return note
	}

	public async createTag({ name, signal }: { name: string; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()
		const tag = await sdkClient.createNoteTag(
			name,
			signal
				? {
						signal
					}
				: undefined
		)

		notesTagsQueryUpdate({
			updater: prev => [...prev.filter(t => t.uuid !== tag.uuid), tag]
		})

		return tag
	}

	public async renameTag({ tag, newName, signal }: { tag: NoteTag; newName: string; signal?: AbortSignal }) {
		if (newName === tag.name) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		tag = await sdkClient.renameNoteTag(
			tag,
			newName,
			signal
				? {
						signal
					}
				: undefined
		)

		notesTagsQueryUpdate({
			updater: prev => prev.map(t => (t.uuid === tag.uuid ? tag : t))
		})

		return tag
	}

	public async deleteTag({ tag, signal }: { tag: NoteTag; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		await sdkClient.deleteNoteTag(
			tag,
			signal
				? {
						signal
					}
				: undefined
		)

		notesTagsQueryUpdate({
			updater: prev => prev.filter(t => t.uuid !== tag.uuid)
		})
	}

	public async favoriteTag({ tag, signal, favorite }: { tag: NoteTag; signal?: AbortSignal; favorite: boolean }) {
		if (tag.favorite === favorite) {
			return
		}

		const sdkClient = await auth.getSdkClient()

		tag = await sdkClient.setNoteTagFavorited(
			tag,
			favorite,
			signal
				? {
						signal
					}
				: undefined
		)

		notesTagsQueryUpdate({
			updater: prev => prev.map(t => (t.uuid === tag.uuid ? tag : t))
		})

		return tag
	}

	public async leave({ note, signal }: { note: Note; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.removeNoteParticipant(
			note,
			(await sdkClient.toStringified()).userId,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.filter(n => n.uuid !== note.uuid)
		})

		return note
	}

	public async removeParticipant({ note, signal, participantUserId }: { note: Note; signal?: AbortSignal; participantUserId: bigint }) {
		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.removeNoteParticipant(
			note,
			participantUserId,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async addParticipant({
		note,
		signal,
		permissionsWrite,
		contact
	}: {
		note: Note
		signal?: AbortSignal
		permissionsWrite: boolean
		contact: Contact
	}) {
		const sdkClient = await auth.getSdkClient()

		note = await sdkClient.addNoteParticipant(
			note,
			contact,
			permissionsWrite,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev => prev.map(n => (n.uuid === note.uuid ? note : n))
		})

		return note
	}

	public async setParticipantPermission({
		note,
		signal,
		participant,
		permissionsWrite
	}: {
		note: Note
		signal?: AbortSignal
		participant: NoteParticipant
		permissionsWrite: boolean
	}) {
		const sdkClient = await auth.getSdkClient()

		participant = await sdkClient.setNoteParticipantPermission(
			note.uuid,
			participant,
			permissionsWrite,
			signal
				? {
						signal
					}
				: undefined
		)

		notesQueryUpdate({
			updater: prev =>
				prev.map(n =>
					n.uuid === note.uuid
						? {
								...note,
								participants: note.participants.map(p => (p.userId === participant.userId ? participant : p))
							}
						: n
				)
		})

		return note
	}
}

export const notes = new Notes()

export default notes
