import { create } from "zustand"
import type { QuillFormats } from "@/components/textEditor/dom"

export type RichtextStore = {
	formats: QuillFormats
	toolbarHeight: number
	setToolbarHeight: (fn: number | ((prev: number) => number)) => void
	setFormats: (fn: QuillFormats | ((prev: QuillFormats) => QuillFormats)) => void
}

export const useRichtextStore = create<RichtextStore>(set => ({
	formats: {},
	toolbarHeight: 0,
	setToolbarHeight(fn) {
		set(state => ({
			toolbarHeight: typeof fn === "function" ? fn(state.toolbarHeight) : fn
		}))
	},
	setFormats(fn) {
		set(state => ({
			formats: typeof fn === "function" ? fn(state.formats) : fn
		}))
	}
}))

export default useRichtextStore
