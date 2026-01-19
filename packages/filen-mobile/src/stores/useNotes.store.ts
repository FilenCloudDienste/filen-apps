import { create } from "zustand"
import type { Note, NoteTag } from "@filen/sdk-rs"

export type InflightContent = Record<
	string,
	{
		timestamp: number
		content: string
		note: Note
	}[]
>

export type NotesStore = {
	inflightContent: InflightContent
	selectedNotes: Note[]
	activeNote: Note | null
	activeTag: NoteTag | null
	selectedTags: NoteTag[]
	setActiveNote: (fn: Note | null | ((prev: Note | null) => Note | null)) => void
	setActiveTag: (fn: NoteTag | null | ((prev: NoteTag | null) => NoteTag | null)) => void
	setSelectedNotes: (fn: Note[] | ((prev: Note[]) => Note[])) => void
	setSelectedTags: (fn: NoteTag[] | ((prev: NoteTag[]) => NoteTag[])) => void
	setInflightContent: (fn: InflightContent | ((prev: InflightContent) => InflightContent)) => void
}

export const useNotesStore = create<NotesStore>(set => ({
	inflightContent: {},
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
	setInflightContent(fn) {
		set(state => ({
			inflightContent: typeof fn === "function" ? fn(state.inflightContent) : fn
		}))
	}
}))

export default useNotesStore
