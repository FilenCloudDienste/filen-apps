import { create } from "zustand"
import type { ChatTyping } from "@filen/sdk-rs"

export type InputViewLayout = {
	width: number
	height: number
	x: number
	y: number
}

export type Suggestions = "mentions" | "reply" | "emojis"

export type Typing = Omit<ChatTyping, "typingType">[]

export type ChatsStore = {
	inputViewLayout: InputViewLayout
	inputSelection: {
		start: number
		end: number
	}
	suggestionsVisible: Suggestions[]
	inputFocused: boolean
	typing: Record<string, Typing>
	setTyping: (fn: Record<string, Typing> | ((prev: Record<string, Typing>) => Record<string, Typing>)) => void
	setInputFocused: (fn: boolean | ((prev: boolean) => boolean)) => void
	setSuggestionsVisible: (fn: Suggestions[] | ((prev: Suggestions[]) => Suggestions[])) => void
	setInputSelection: (
		selection:
			| {
					start: number
					end: number
			  }
			| ((prev: { start: number; end: number }) => {
					start: number
					end: number
			  })
	) => void
	setInputViewLayout: (fn: InputViewLayout | ((prev: InputViewLayout) => InputViewLayout)) => void
}

export const useChatsStore = create<ChatsStore>(set => ({
	inputViewLayout: {
		width: 0,
		height: 0,
		x: 0,
		y: 0
	},
	inputSelection: {
		start: 0,
		end: 0
	},
	suggestionsVisible: [],
	inputFocused: false,
	typing: {},
	setTyping(typing) {
		set(state => ({
			typing: typeof typing === "function" ? typing(state.typing) : typing
		}))
	},
	setInputFocused(focused) {
		set(state => ({
			inputFocused: typeof focused === "function" ? focused(state.inputFocused) : focused
		}))
	},
	setSuggestionsVisible(visible) {
		set(state => ({
			suggestionsVisible: typeof visible === "function" ? visible(state.suggestionsVisible) : visible
		}))
	},
	setInputSelection(selection) {
		set(state => ({
			inputSelection: typeof selection === "function" ? selection(state.inputSelection) : selection
		}))
	},
	setInputViewLayout(fn) {
		set(state => ({
			inputViewLayout: typeof fn === "function" ? fn(state.inputViewLayout) : fn
		}))
	}
}))

export default useChatsStore
