import { memo, useCallback, useMemo } from "react"
import type { Note as NoteType } from "@filen/sdk-rs"
import { CheckCircleIcon, EllipsisVerticalIcon, LoaderIcon, EyeIcon } from "lucide-react"
import { Button } from "../ui/button"
import useNoteContentQuery from "@/queries/useNoteContent.query"
import notes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { NoteMenu } from "../sidebar/inner/notes/content"
import useNotesStore from "@/stores/notes.store"
import { useShallow } from "zustand/shallow"
import { useAuth } from "@/hooks/useAuth"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

export const NotesHeader = memo(({ note }: { note: NoteType }) => {
	const syncing = useNotesStore(useShallow(state => state.syncing))
	const { client } = useAuth()

	const noteContentQuery = useNoteContentQuery(
		{
			uuid: note.uuid
		},
		{
			enabled: false
		}
	)

	const canEdit = useMemo(() => {
		return note.ownerId === client?.userId || note.participants.some(p => p.userId === client?.userId && p.permissionsWrite)
	}, [client, note])

	const rename = useCallback(async () => {
		try {
			await notes.rename(note)
		} catch (e) {
			console.error(e)
			toasts.error(e)
		}
	}, [note])

	return (
		<div className="flex shrink-0 flex-row items-center p-2 px-4 border-b justify-between overflow-hidden w-full gap-4">
			<div className="flex flex-1 flex-row items-center gap-4 overflow-hidden">
				{noteContentQuery.isFetching ||
				noteContentQuery.isRefetching ||
				noteContentQuery.isLoading ||
				noteContentQuery.isPending ||
				syncing ? (
					<LoaderIcon className="animate-spin size-4 text-primary shrink-0" />
				) : (
					<CheckCircleIcon className="text-green-500 size-4 shrink-0" />
				)}
				{!canEdit && (
					<Tooltip>
						<TooltipTrigger asChild={true}>
							<EyeIcon className="text-muted-foreground size-4 shrink-0" />
						</TooltipTrigger>
						<TooltipContent className="select-none">tbd</TooltipContent>
					</Tooltip>
				)}
				<p
					className="truncate w-0 flex-1 text-ellipsis cursor-text"
					onClick={rename}
				>
					{note?.title ?? note.uuid}
				</p>
			</div>
			<NoteMenu
				note={note}
				type="dropdown"
			>
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
				>
					<EllipsisVerticalIcon />
				</Button>
			</NoteMenu>
		</div>
	)
})

NotesHeader.displayName = "NotesHeader"

export default NotesHeader
