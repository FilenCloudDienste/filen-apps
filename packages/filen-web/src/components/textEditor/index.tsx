import { memo, useMemo, useCallback, useRef, useEffect, useState } from "react"
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror"
import { getPreviewType, cn } from "@/lib/utils"
import { githubDark, githubLight } from "@uiw/codemirror-themes-all"
import { langs, loadLanguage as uiwLoadLanguage, langNames } from "@uiw/codemirror-extensions-langs"
import MDEditor from "@uiw/react-md-editor"
import { useTheme } from "@/providers/theme.provider"
import DOMPurify from "dompurify"
import Quill, { type QuillOptions } from "quill"
import useColorScheme from "@/hooks/useColorScheme"
import { QuillThemeCustomizer } from "./quillTheme"
import pathModule from "path"
import rehypeSanitize from "rehype-sanitize"
import { createTextThemes } from "./textTheme"
import "quill/dist/quill.snow.css"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

for (const lang of langNames) {
	uiwLoadLanguage(lang)
}

export function parseExtension(name: string) {
	const normalized = name.toLowerCase().trim()

	if (!normalized.includes(".")) {
		return ""
	}

	const parts = normalized.split(".")
	const lastPart = parts[parts.length - 1]

	return `.${lastPart}`
}

export function loadLanguage(name: string) {
	const ext = parseExtension(name)

	if (!ext.includes(".") || !langNames.includes(ext.replace(".", ""))) {
		return null
	}

	const lang = langs[ext.replace(".", "")]

	if (!lang) {
		return null
	}

	return lang()
}

export const textThemes = createTextThemes({
	backgroundColor: "var(--background)",
	textForegroundColor: "var(--primary)"
})

export const TextEditor = memo(
	({
		initialValue,
		onValueChange,
		width,
		height,
		fileName,
		editable,
		placeholder,
		richText,
		autoFocus
	}: {
		initialValue: string
		onValueChange: (value: string) => void
		width?: number
		height?: number
		fileName?: string
		editable?: boolean
		placeholder?: string
		richText?: boolean
		autoFocus?: boolean
	}) => {
		const { dark } = useTheme()
		const quillEditorRef = useRef<HTMLDivElement>(null)
		const quillRef = useRef<Quill | null>(null)
		const colorScheme = useColorScheme()
		const quillCustomThemeRef = useRef<QuillThemeCustomizer | null>(null)
		const codeMirrorRef = useRef<ReactCodeMirrorRef>(null)
		const [value, setValue] = useState<string>(initialValue)

		const type = useMemo(() => {
			return getPreviewType(fileName ?? "file.tsx")
		}, [fileName])

		const isTextFile = useMemo(() => {
			return type === "text" || pathModule.posix.extname(fileName ?? "file.tsx") === ".txt"
		}, [fileName, type])

		const codeMirrorTheme = useMemo(() => {
			if (isTextFile) {
				return textThemes.windows[dark ? "dark" : "light"]
			}

			return dark ? githubDark : githubLight
		}, [dark, isTextFile])

		const extensions = useMemo(() => {
			const base = [
				EditorView.lineWrapping,
				EditorView.theme({
					"&": {
						outline: "none !important",
						fontSize: "14px"
					},
					"&.cm-focused": {
						outline: "none !important",
						border: "none !important",
						boxShadow: "none !important"
					},
					"&:focus-visible": {
						outline: "none !important"
					}
				})
			]

			if (isTextFile) {
				return [
					...base,
					EditorView.theme({
						"&": {
							outline: "none !important",
							padding: "8px",
							fontSize: "16px"
						},
						"&.cm-focused": {
							outline: "none !important",
							border: "none !important",
							boxShadow: "none !important"
						},
						"&:focus-visible": {
							outline: "none !important"
						},
						".cm-gutters": {
							display: "none"
						},
						".cm-line": {
							lineHeight: "1.5"
						}
					})
				]
			}

			const lang = loadLanguage(fileName ?? "file.tsx")

			if (!lang) {
				return [...base]
			}

			return [...base, lang]
		}, [isTextFile, fileName])

		const onChangeValue = useCallback(
			(val?: string) => {
				onValueChange(val ?? "")
				setValue(val ?? "")
			},
			[onValueChange]
		)

		useEffect(() => {
			if (!codeMirrorRef.current || !editable || value.length === 0 || !autoFocus) {
				return
			}

			setTimeout(() => {
				codeMirrorRef.current?.view?.dispatch({
					selection: {
						anchor: value.length
					}
				})

				codeMirrorRef.current?.view?.focus()
			}, 1)
		}, [value, editable, autoFocus])

		useEffect(() => {
			if (!richText || !quillEditorRef.current || quillRef.current) {
				return
			}

			const quillOptions = {
				readOnly: editable === false,
				modules: {
					toolbar: [
						[
							{
								header: [1, 2, 3, 4, 5, 6, false]
							}
						],
						["bold", "italic", "underline"],
						["code-block", "link", "blockquote"],
						[
							{
								list: "ordered"
							},
							{
								list: "bullet"
							},
							{
								list: "check"
							}
						],
						[
							{
								indent: "-1"
							},
							{
								indent: "+1"
							}
						],
						[
							{
								script: "sub"
							},
							{
								script: "super"
							}
						],
						[
							{
								direction: "rtl"
							}
						]
					]
				},
				placeholder,
				theme: "snow"
			} satisfies QuillOptions

			quillRef.current = new Quill(quillEditorRef.current, quillOptions)

			const sanitized = DOMPurify.sanitize(value, {
				ALLOWED_TAGS: [
					"p",
					"strong",
					"em",
					"u",
					"a",
					"h1",
					"h2",
					"h3",
					"h4",
					"h5",
					"h6",
					"code",
					"ol",
					"ul",
					"li",
					"blockquote",
					"pre",
					"br",
					"span",
					"div"
				],
				ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class", "style"]
			})

			DOMPurify.addHook("afterSanitizeAttributes", (node: Element) => {
				if (node.tagName === "A" && node.getAttribute("href")) {
					node.setAttribute("target", "_blank")
					node.setAttribute("rel", "noopener noreferrer")
				}
			})

			quillRef.current.clipboard.dangerouslyPasteHTML(sanitized)

			quillRef.current.on("text-change", () => {
				if (quillRef.current) {
					const content = quillRef.current.root.innerHTML

					if (!content || content.length === 0) {
						return
					}

					onChangeValue(content)
				}
			})

			if (autoFocus) {
				quillRef.current.setSelection(sanitized.length, 0)
			}
		}, [quillEditorRef, placeholder, value, onChangeValue, type, editable, richText, autoFocus])

		useEffect(() => {
			if (!quillRef.current) {
				return
			}

			if (quillCustomThemeRef.current) {
				quillCustomThemeRef.current.removeExistingStyles()
			}

			quillCustomThemeRef.current = new QuillThemeCustomizer()

			quillCustomThemeRef.current.apply(quillEditorRef.current?.id)
		}, [colorScheme, dark, editable])

		if (richText) {
			return (
				<div
					className="flex flex-1 overflow-hidden"
					style={{
						width: width ?? "100%",
						height: height ?? "100%"
					}}
				>
					<div className="flex flex-col quill-editor-container overflow-hidden w-full h-full">
						<div
							ref={quillEditorRef}
							className="quill-editor overflow-hidden w-full h-full text-sm select-text"
							spellCheck={false}
							autoCapitalize="off"
							autoCorrect="off"
						/>
					</div>
				</div>
			)
		}

		if (type === "markdown") {
			return (
				<div
					className="overflow-x-hidden overflow-y-auto"
					style={{
						width: width ?? "100%",
						height: height ?? "100%"
					}}
				>
					<MDEditor
						value={value}
						onChange={onChangeValue}
						height={height ?? "100%"}
						visibleDragbar={false}
						tabSize={4}
						data-color-mode={dark ? "dark" : "light"}
						hideToolbar={false}
						autoCapitalize="off"
						autoCorrect="off"
						spellCheck={false}
						preview="live"
						autoFocus={autoFocus}
						autoFocusEnd={autoFocus}
						previewOptions={{
							rehypePlugins: [[rehypeSanitize]]
						}}
						textareaProps={{
							placeholder,
							style: {
								fontFamily: "var(--font-mono)",
								fontSize: 14,
								opacity: editable === false ? 0.6 : 1,
								cursor: editable === false ? "not-allowed" : "text"
							},
							readOnly: editable === false,
							id: "md-editor-textarea"
						}}
						className="text-sm select-text"
						style={{
							width: width ?? "100%",
							height: height ?? "100%",
							borderTopLeftRadius: "0px",
							borderTopRightRadius: "0px",
							borderTop: "none",
							fontFamily: "var(--font-mono)",
							fontSize: 14,
							opacity: editable === false ? 0.6 : 1,
							cursor: editable === false ? "not-allowed" : "text"
						}}
					/>
				</div>
			)
		}

		return (
			<div
				className="overflow-x-hidden overflow-y-auto"
				style={{
					width: width ?? "100%",
					height: height ?? "100%"
				}}
			>
				<CodeMirror
					ref={codeMirrorRef}
					value={value}
					onChange={onChangeValue}
					extensions={extensions}
					theme={codeMirrorTheme}
					editable={editable}
					placeholder={placeholder}
					autoFocus={autoFocus}
					className={cn("text-sm select-text", !isTextFile && "font-mono", isTextFile && "text-base")}
					width={width ? `${width}px` : "100%"}
					height={height ? `${height}px` : "100%"}
					style={{
						width: width ?? "100%",
						height: height ?? "100%"
					}}
				/>
			</div>
		)
	}
)

TextEditor.displayName = "TextEditor"

export default TextEditor
