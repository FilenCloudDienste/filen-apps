import { memo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { DriveItemFileWithPreviewType } from "@/stores/preview.store"
import serviceWorker from "@/lib/serviceWorker"
import { langs, loadLanguage as uiwLoadLanguage, langNames } from "@uiw/codemirror-extensions-langs"
import TextEditor from "../textEditor"

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

	if (!ext.includes(".") || !langNames.includes(ext.replace(".", "") as unknown as (typeof langNames)[0])) {
		return null
	}

	const lang = langs[ext.replace(".", "") as unknown as (typeof langNames)[0]]

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

	if (query.status !== "success") {
		return null
	}

	return (
		<TextEditor
			initialValue={query.data}
			onValueChange={() => null}
			width={width}
			height={height}
			fileName={item.meta?.name ?? "file.tsx"}
			editable={false}
			placeholder="No content"
		/>
	)
})

TextPreview.displayName = "TextPreview"

export default TextPreview
