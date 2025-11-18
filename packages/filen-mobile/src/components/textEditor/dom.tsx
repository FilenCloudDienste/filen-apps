"use dom"

import "@/global.css"

import { type DOMProps } from "expo/dom"
import { memo, useEffect, useRef, useCallback, useMemo } from "react"
import type { Platform } from "react-native"
import CodeMirror, { EditorView } from "@uiw/react-codemirror"
import { xcodeLight, xcodeDark } from "@uiw/codemirror-theme-xcode"
import { materialDark, materialLight } from "@uiw/codemirror-theme-material"
import type { TextEditorType, Font, Colors } from "@/components/textEditor"
import { cn } from "@filen/utils"
import { createTextThemes, parseExtension, loadLanguage } from "@/components/textEditor/codeMirror"

const TextEditorDOM = memo(
	({
		initialValue,
		onValueChange,
		placeholder,
		darkMode,
		platform,
		readOnly,
		fileName,
		type,
		autoFocus,
		font,
		colors
	}: {
		dom?: DOMProps
		initialValue?: string
		onValueChange?: (value: string) => void
		placeholder?: string
		darkMode: boolean
		platform: Platform["OS"]
		readOnly?: boolean
		fileName?: string
		type: TextEditorType
		autoFocus?: boolean
		font?: Font
		colors?: Colors
	}) => {
		const didTypeRef = useRef<boolean>(false)

		const onChange = useCallback(
			(value: string) => {
				if (!didTypeRef.current) {
					return
				}

				onValueChange?.(value)
			},
			[onValueChange]
		)

		const isTextFile = useMemo(() => {
			return type === "text" || parseExtension(fileName ?? "file.tsx") === ".txt"
		}, [fileName, type])

		const theme = useMemo(() => {
			if (isTextFile) {
				const textThemes = createTextThemes({
					backgroundColor: colors?.background?.primary ?? (darkMode ? "#0d1118" : "#ffffff"),
					textForegroundColor: colors?.text?.foreground ?? (darkMode ? "#c9d1d9" : "#24292e")
				})

				return textThemes[platform === "ios" ? "macOS" : "linux"][darkMode ? "dark" : "light"]
			}

			return platform === "android" ? (darkMode ? materialDark : materialLight) : darkMode ? xcodeDark : xcodeLight
		}, [darkMode, platform, isTextFile, colors])

		const extensions = useMemo(() => {
			const base = [
				EditorView.lineWrapping,
				EditorView.theme({
					"&": {
						outline: "none !important",
						fontSize: type === "text" ? `${font?.size ?? 16}px !important` : `${font?.size ?? 14}px !important`,
						fontFamily: `${font?.family ?? "inherit"} !important`,
						padding: type === "text" ? "16px" : "0px"
					},
					"&.cm-focused": {
						outline: "none !important",
						border: "none !important",
						boxShadow: "none !important"
					},
					"&:focus-visible": {
						outline: "none !important"
					},
					...(isTextFile
						? {
								".cm-gutters": {
									display: "none !important"
								},
								".cm-line": {
									lineHeight: `${font?.lineHeight ?? 1.5} !important`,
									fontSize: type === "text" ? `${font?.size ?? 16}px !important` : `${font?.size ?? 14}px !important`,
									fontFamily: `${font?.family ?? "inherit"} !important`
								}
							}
						: {
								".cm-gutters": {
									fontSize: type === "text" ? `${font?.size ?? 16}px !important` : `${font?.size ?? 14}px !important`,
									fontFamily: `${font?.family ?? "inherit"} !important`
								},
								".cm-line": {
									fontSize: type === "text" ? `${font?.size ?? 16}px !important` : `${font?.size ?? 14}px !important`,
									fontFamily: `${font?.family ?? "inherit"} !important`
								}
							})
				})
			]

			const lang = loadLanguage(fileName ?? "file.tsx")

			if (isTextFile || !lang) {
				return base
			}

			return [...base, lang]
		}, [isTextFile, fileName, font, type])

		useEffect(() => {
			const listener = () => {
				didTypeRef.current = true
			}

			window.addEventListener("keydown", listener)

			return () => {
				window.removeEventListener("keydown", listener)
			}
		}, [])

		return (
			<CodeMirror
				value={initialValue}
				width="100dvw"
				onChange={onChange}
				extensions={extensions}
				readOnly={readOnly}
				placeholder={placeholder}
				indentWithTab={true}
				theme={theme}
				autoCapitalize="off"
				autoCorrect="off"
				autoSave="off"
				spellCheck={false}
				autoFocus={autoFocus ?? (initialValue ?? "").length === 0}
				className={cn("select-text", !isTextFile && "font-mono", isTextFile && "font-sans")}
				style={{
					width: "100dvw",
					paddingBottom: 128
				}}
			/>
		)
	}
)

TextEditorDOM.displayName = "TextEditorDOM"

export default TextEditorDOM
