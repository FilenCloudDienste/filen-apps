import { create } from "zustand"

export type TextEditorStore = {
	ready: boolean
	setReady: (fn: boolean | ((prev: boolean) => boolean)) => void
}

export const useTextEditorStore = create<TextEditorStore>(set => ({
	ready: false,
	setReady(fn) {
		set(state => ({
			ready: typeof fn === "function" ? fn(state.ready) : fn
		}))
	}
}))

export default useTextEditorStore
