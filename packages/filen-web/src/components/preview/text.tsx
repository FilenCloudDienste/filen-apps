import { memo, useMemo } from "react"
import CodeMirror, { EditorView } from "@uiw/react-codemirror"
import { useQuery } from "@tanstack/react-query"
import type { DriveItemFileWithPreviewType } from "@/stores/preview.store"
import serviceWorker from "@/lib/serviceWorker"
import { xcodeDark } from "@uiw/codemirror-themes-all"
import { langs, loadLanguage as uiwLoadLanguage, langNames } from "@uiw/codemirror-extensions-langs"
import MDEditor from "@uiw/react-md-editor"

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

export const TextPreview = memo(({ item, width, height }: { item: DriveItemFileWithPreviewType; width: number; height: number }) => {
	const query = useQuery({
		queryKey: ["textPreviewQuery", item],
		queryFn: async () => {
			const res = await fetch(
				serviceWorker.buildDownloadUrl({
					items: [
						{
							type: "file",
							...item
						}
					],
					type: "stream",
					name: item.meta?.name
				})
			)

			if (!res.ok) {
				throw new Error("Failed to fetch file content")
			}

			return await res.text()
		}
	})

	const codeMirrorTheme = useMemo(() => {
		return xcodeDark
	}, [])

	const extensions = useMemo(() => {
		const base = [
			EditorView.lineWrapping,
			EditorView.theme({
				"&": {
					outline: "none !important"
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
		const lang = loadLanguage(item.meta?.name ?? "file.tsx")

		if (!lang) {
			return [...base]
		}

		return [...base, lang]
	}, [item.meta?.name])

	if (query.status !== "success") {
		return null
	}

	if (item.previewType === "markdown") {
		return (
			<div
				className="overflow-x-hidden overflow-y-auto"
				style={{
					width,
					height
				}}
			>
				<MDEditor
					value={query.data}
					height={height}
					style={{
						width,
						height,
						borderTopLeftRadius: "0px",
						borderTopRightRadius: "0px"
					}}
				/>
			</div>
		)
	}

	return (
		<div
			className="overflow-x-hidden overflow-y-auto"
			style={{
				width,
				height
			}}
		>
			<CodeMirror
				value={query.data}
				//onChange={onChange}
				extensions={extensions}
				theme={codeMirrorTheme}
				//editable={!readOnly}
				//placeholder={placeholder}
				className="font-mono text-sm select-text"
				width={`${width}px`}
				height={`${height}px`}
				style={{
					width,
					height
				}}
			/>
		</div>
	)
})

TextPreview.displayName = "TextPreview"

export default TextPreview
