import type { Note, NoteHistory } from "@filen/sdk-rs"
import { memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import Checklist from "@/components/notes/checklist"
import TextEditor from "@/components/textEditor"
import { simpleDate } from "@/lib/utils"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"

export const HistoryItem = memo(({ note, history }: { note: Note; history: NoteHistory }) => {
	const onClick = useCallback(async () => {
		try {
			await libNotes.restoreHistory(note, history)
		} catch (e) {
			console.error(e)
			toasts.error(e)
		}
	}, [note, history])

	return (
		<div className="flex flex-1 flex-col h-[50dvh] w-[50dvh]">
			<div className="flex flex-1 flex-row overflow-x-hidden overflow-y-auto h-full w-full select-text">
				{history.noteType === "checklist" && (
					<Checklist
						editable={false}
						initialValue={history.content ?? ""}
					/>
				)}
				{(history.noteType === "text" ||
					history.noteType === "md" ||
					history.noteType === "code" ||
					history.noteType === "rich") && (
					<TextEditor
						editable={false}
						initialValue={history.content ?? ""}
					/>
				)}
			</div>
			<div className="flex flex-row items-center justify-between gap-4 p-2 border-t border-border">
				<p className="truncate text-sm text-muted-foreground">{simpleDate(Number(history.editedTimestamp))}</p>
				<Button
					variant="default"
					size="sm"
					onClick={onClick}
				>
					tbd
				</Button>
			</div>
		</div>
	)
})

HistoryItem.displayName = "HistoryItem"
