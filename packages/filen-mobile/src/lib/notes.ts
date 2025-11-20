import auth from "@/lib/auth"
import { type Note, NoteType } from "@filen/sdk-rs"
import { noteContentQueryUpdate } from "@/queries/useNoteContent.query"
import { createNotePreviewFromContentText } from "@filen/utils"
import { notesQueryUpdate } from "@/queries/useNotes.query"

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
					note
				},
				updater: content
			})
		}
	}
}

export const notes = new Notes()

export default notes
