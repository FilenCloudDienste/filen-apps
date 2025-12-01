import { create } from "zustand"
import type { Note, NoteTag } from "@filen/sdk-rs"

export type TemporaryContent = Record<
	string,
	{
		timestamp: number
		content: string
		note: Note
	}[]
>

export type NotesStore = {
	temporaryContent: TemporaryContent
	selectedNotes: Note[]
	activeNote: Note | null
	activeTag: NoteTag | null
	selectedTags: NoteTag[]
	setActiveNote: (fn: Note | null | ((prev: Note | null) => Note | null)) => void
	setActiveTag: (fn: NoteTag | null | ((prev: NoteTag | null) => NoteTag | null)) => void
	setSelectedNotes: (fn: Note[] | ((prev: Note[]) => Note[])) => void
	setSelectedTags: (fn: NoteTag[] | ((prev: NoteTag[]) => NoteTag[])) => void
	setTemporaryContent: (fn: TemporaryContent | ((prev: TemporaryContent) => TemporaryContent)) => void
}

export const useNotesStore = create<NotesStore>(set => ({
	temporaryContent: {},
	selectedNotes: [],
	activeNote: null,
	activeTag: null,
	selectedTags: [],
	setSelectedTags(fn) {
		set(state => ({
			selectedTags: typeof fn === "function" ? fn(state.selectedTags) : fn
		}))
	},
	setActiveTag(fn) {
		set(state => ({
			activeTag: typeof fn === "function" ? fn(state.activeTag) : fn
		}))
	},
	setActiveNote(fn) {
		set(state => ({
			activeNote: typeof fn === "function" ? fn(state.activeNote) : fn
		}))
	},
	setSelectedNotes(fn) {
		set(state => ({
			selectedNotes: typeof fn === "function" ? fn(state.selectedNotes) : fn
		}))
	},
	setTemporaryContent(fn) {
		set(state => ({
			temporaryContent: typeof fn === "function" ? fn(state.temporaryContent) : fn
		}))
	}
}))

export default useNotesStore
