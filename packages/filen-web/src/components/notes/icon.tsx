import {
	IoTextOutline,
	IoLogoMarkdown,
	IoCodeOutline,
	IoDocumentTextOutline,
	IoCheckboxOutline,
	IoTrashOutline,
	IoArchiveOutline
} from "react-icons/io5"
import { memo } from "react"
import type { NoteType } from "@filen/sdk-rs"
import { cn } from "@/lib/utils"

export const Icon = memo(({ type, className }: { type: NoteType | "archive" | "trash"; className?: string }) => {
	switch (type) {
		case "text": {
			return (
				<IoTextOutline
					color="#3b82f6"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "md": {
			return (
				<IoLogoMarkdown
					color="#6366f1"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "code": {
			return (
				<IoCodeOutline
					color="#ef4444"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "rich": {
			return (
				<IoDocumentTextOutline
					color="#06b6d4"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "checklist": {
			return (
				<IoCheckboxOutline
					color="#a855f7"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "archive": {
			return (
				<IoArchiveOutline
					color="#eab308"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		case "trash": {
			return (
				<IoTrashOutline
					color="#ef4444"
					className={cn("size-4 shrink-0", className)}
				/>
			)
		}

		default: {
			return null
		}
	}
})

Icon.displayName = "Icon"

export default Icon
