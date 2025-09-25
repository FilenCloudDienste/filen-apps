import { create } from "zustand"
import type { Note } from "@filen/sdk-rs"

export type NotesStore = {
	syncing: Note | null
	draggingNotes: Note[]
	setDraggingNotes: (fn: Note[] | ((prev: Note[]) => Note[])) => void
	setSyncing: (fn: Note | null | ((prev: Note | null) => Note | null)) => void
}

export const useNotesStore = create<NotesStore>(set => ({
	syncing: null,
	draggingNotes: [],
	setDraggingNotes(fn) {
		set(state => ({
			draggingNotes: typeof fn === "function" ? fn(state.draggingNotes) : fn
		}))
	},
	setSyncing(fn) {
		set(state => ({
			syncing: typeof fn === "function" ? fn(state.syncing) : fn
		}))
	}
}))

export default useNotesStore
