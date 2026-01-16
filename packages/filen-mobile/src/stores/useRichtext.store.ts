import { create } from "zustand"
import type { QuillFormats } from "@/components/textEditor/richText/dom"

export type RichtextStore = {
	formats: QuillFormats
	setFormats: (fn: QuillFormats | ((prev: QuillFormats) => QuillFormats)) => void
}

export const useRichtextStore = create<RichtextStore>(set => ({
	formats: {},
	setFormats(fn) {
		set(state => ({
			formats: typeof fn === "function" ? fn(state.formats) : fn
		}))
	}
}))

export default useRichtextStore
