import Ionicons from "@expo/vector-icons/Ionicons"
import { type Note, NoteType } from "@filen/sdk-rs"
import { useMemo, memo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"

export enum NoteTypeExtended {
	Trash = 101,
	Archive = 102
}

export type IconKey = NoteType | NoteTypeExtended

export const ICON_PROPS = {
	[NoteType.Text]: {
		name: "text-outline",
		color: "#3b82f6"
	},
	[NoteType.Md]: {
		name: "logo-markdown",
		color: "#6366f1"
	},
	[NoteType.Code]: {
		name: "code-outline",
		color: "#ef4444"
	},
	[NoteType.Rich]: {
		name: "document-text-outline",
		color: "#06b6d4"
	},
	[NoteType.Checklist]: {
		name: "checkmark-circle-outline",
		color: "#a855f7"
	},
	[NoteTypeExtended.Trash]: {
		name: "trash-outline",
		color: "#ef4444"
	},
	[NoteTypeExtended.Archive]: {
		name: "archive-outline",
		color: "#eab308"
	}
} as const

export const Icon = memo(
	({ note, iconSize }: { note: Note; iconSize: number }) => {
		const textForeground = useResolveClassNames("text-foreground")

		const { color, name } = useMemo(() => {
			let iconKey: IconKey

			if (note.trash) {
				iconKey = NoteTypeExtended.Trash
			}

			if (note.archive) {
				iconKey = NoteTypeExtended.Archive
			}

			iconKey = note.noteType

			return ICON_PROPS[iconKey]
		}, [note.trash, note.archive, note.noteType])

		return (
			<Ionicons
				name={name}
				color={color ?? textForeground.color}
				size={iconSize}
			/>
		)
	},
	{
		propsAreEqual(prevProps, nextProps) {
			return (
				prevProps.note.uuid === nextProps.note.uuid &&
				prevProps.note.trash === nextProps.note.trash &&
				prevProps.note.archive === nextProps.note.archive &&
				prevProps.note.noteType === nextProps.note.noteType &&
				prevProps.iconSize === nextProps.iconSize
			)
		}
	}
)

export default Icon
