import { create } from "zustand"
import type { Note } from "@filen/sdk-rs"

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
	selected: Note[]
	active: Note | null
	setActive: (fn: Note | null | ((prev: Note | null) => Note | null)) => void
	setSelected: (fn: Note[] | ((prev: Note[]) => Note[])) => void
	setTemporaryContent: (fn: TemporaryContent | ((prev: TemporaryContent) => TemporaryContent)) => void
}

export const useNotesStore = create<NotesStore>(set => ({
	temporaryContent: {},
	selected: [],
	active: null,
	setActive(fn) {
		set(state => ({
			active: typeof fn === "function" ? fn(state.active) : fn
		}))
	},
	setSelected(fn) {
		set(state => ({
			selected: typeof fn === "function" ? fn(state.selected) : fn
		}))
	},
	setTemporaryContent(fn) {
		set(state => ({
			temporaryContent: typeof fn === "function" ? fn(state.temporaryContent) : fn
		}))
	}
}))

export default useNotesStore
