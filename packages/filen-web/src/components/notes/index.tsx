import { memo, useMemo } from "react"
import useIdb from "@/hooks/useIdb"
import type { Note as NoteType } from "@filen/sdk-rs"
import { Navigate } from "@tanstack/react-router"
import useNotesQuery from "@/queries/useNotes.query"
import Empty from "./content/empty"

export const NotesIndex = memo(() => {
	const [defaultNote] = useIdb<NoteType | null>("defaultNote", null)

	const notesQuery = useNotesQuery({
		enabled: false
	})

	const note = useMemo(() => {
		if (notesQuery.status !== "success" || !defaultNote) {
			return null
		}

		return notesQuery.data.find(n => n.uuid === defaultNote.uuid) ?? null
	}, [notesQuery.data, defaultNote, notesQuery.status])

	if (note) {
		return (
			<Navigate
				to="/notes/$"
				params={{
					_splat: note.uuid
				}}
			/>
		)
	}

	return <Empty />
})

NotesIndex.displayName = "NotesIndex"

export default NotesIndex
