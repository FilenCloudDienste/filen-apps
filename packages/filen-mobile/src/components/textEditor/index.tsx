import { memo, useRef, Fragment } from "react"
import TextEditorDOM from "@/components/textEditor/dom"
import RichTextEditorDOM, { type QuillFormats, type HeaderLevel } from "@/components/textEditor/richText/dom"
import View from "@/components/ui/view"
import { useNativeDomEvents, type DOMRef } from "@/hooks/useDomEvents/useNativeDomEvents"
import { Platform } from "react-native"
import { useResolveClassNames, useUniwind } from "uniwind"
import { useKeyboardState } from "react-native-keyboard-controller"
import useRichtextStore from "@/stores/useRichtext.store"
import { useShallow } from "zustand/shallow"
import RichTextEditorToolbar from "@/components/textEditor/richText/toolbar"

export type TextEditorType = "richtext" | "text" | "markdown" | "code"

export type TextEditorEvents =
	| {
			type: "quillFormats"
			data: QuillFormats
	  }
	| {
			type: "quillToggleBold"
	  }
	| {
			type: "dismissKeyboard"
	  }
	| {
			type: "quillToggleItalic"
	  }
	| {
			type: "quillToggleUnderline"
	  }
	| {
			type: "quillToggleHeader"
			data: HeaderLevel
	  }
	| {
			type: "quillRemoveLink"
	  }
	| {
			type: "quillAddLink"
			data: string
	  }
	| {
			type: "quillRemoveHeader"
	  }
	| {
			type: "quillToggleCodeBlock"
	  }
	| {
			type: "quillToggleBlockquote"
	  }
	| {
			type: "quillToggleList"
			data: "ordered" | "bullet" | "checklist"
	  }
	| {
			type: "quillRemoveList"
	  }

export type Colors = {
	text: {
		foreground: string
		muted: string
		primary: string
	}
	background: {
		primary: string
		secondary: string
	}
}

export type Font = {
	weight?: number
	size?: number
	lineHeight?: number
	family?: string
}

export const backgroundColors = {
	normal: {
		light: Platform.select({
			ios: "#FFFFFF",
			default: "#FAFAFA"
		}),
		dark: Platform.select({
			ios: "#2A2A30",
			default: "#2E3236"
		})
	},
	markdown: {
		light: Platform.select({
			default: "#ffffff"
		}),
		dark: Platform.select({
			default: "#0d1118"
		})
	}
}

export const TextEditor = memo(
	({
		initialValue,
		onValueChange,
		placeholder,
		disableRichtextToolbar,
		type,
		readOnly
	}: {
		initialValue?: string
		onValueChange?: (value: string) => void
		placeholder?: string
		disableRichtextToolbar?: boolean
		type: TextEditorType
		readOnly?: boolean
	}) => {
		const ref = useRef<DOMRef>(null)
		const textForeground = useResolveClassNames("text-foreground")
		const textPrimary = useResolveClassNames("text-primary")
		const textMuted = useResolveClassNames("text-muted")
		const bgBackground = useResolveClassNames("bg-background")
		const bgSecondary = useResolveClassNames("bg-secondary")
		const text = useResolveClassNames("font-normal text-sm")
		const keyboardState = useKeyboardState()
		const { theme } = useUniwind()
		const toolbarHeight = useRichtextStore(useShallow(state => state.toolbarHeight))

		const { onDomMessage, postMessage } = useNativeDomEvents<TextEditorEvents>({
			ref,
			onMessage: message => {
				switch (message.type) {
					case "quillFormats": {
						useRichtextStore.getState().setFormats(message.data)

						break
					}
				}
			}
		})

		return (
			<Fragment>
				<View className="flex-1">
					{type === "richtext" ? (
						<RichTextEditorDOM
							ref={ref}
							dom={{
								onMessage: onDomMessage
							}}
							onValueChange={onValueChange}
							darkMode={theme === "dark"}
							platform={Platform.OS}
							initialValue={initialValue}
							placeholder={placeholder}
							toolbarHeight={toolbarHeight}
							keyboardVisible={keyboardState.isVisible}
							readOnly={readOnly}
							font={{
								family: text.fontFamily as string,
								size: text.fontSize as number,
								weight: text.fontWeight as number
							}}
							colors={{
								text: {
									foreground: textForeground.color as string,
									primary: textPrimary.color as string,
									muted: textMuted.color as string
								},
								background: {
									primary: bgBackground.backgroundColor as string,
									secondary: bgSecondary.backgroundColor as string
								}
							}}
						/>
					) : (
						<View
							className="flex-1"
							style={{
								backgroundColor:
									type === "text"
										? bgBackground.backgroundColor
										: backgroundColors["normal"][theme === "dark" ? "dark" : "light"]
							}}
						>
							<TextEditorDOM
								type={type}
								onValueChange={onValueChange}
								darkMode={theme === "dark"}
								platform={Platform.OS}
								initialValue={initialValue}
								placeholder={placeholder}
								readOnly={readOnly}
								font={{
									family: text.fontFamily as string,
									size: text.fontSize as number,
									weight: text.fontWeight as number
								}}
								colors={{
									text: {
										foreground: textForeground.color as string,
										primary: textPrimary.color as string,
										muted: textMuted.color as string
									},
									background: {
										primary: bgBackground.backgroundColor as string,
										secondary: bgSecondary.backgroundColor as string
									}
								}}
							/>
						</View>
					)}
				</View>
				{!disableRichtextToolbar && type === "richtext" && !readOnly && <RichTextEditorToolbar postMessage={postMessage} />}
			</Fragment>
		)
	}
)

TextEditor.displayName = "TextEditor"

export default TextEditor
