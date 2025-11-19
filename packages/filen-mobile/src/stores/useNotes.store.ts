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
	setTemporaryContent: (fn: TemporaryContent | ((prev: TemporaryContent) => TemporaryContent)) => void
}

export const useNotesStore = create<NotesStore>(set => ({
	temporaryContent: {},
	setTemporaryContent(fn) {
		set(state => ({
			temporaryContent: typeof fn === "function" ? fn(state.temporaryContent) : fn
		}))
	}
}))

export default useNotesStore
