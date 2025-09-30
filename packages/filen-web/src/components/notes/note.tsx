import { memo, useMemo, useEffect } from "react"
import useNoteUuidFromPathname from "@/hooks/useNoteUuidFromPathname"
import useNotesQuery from "@/queries/useNotes.query"
import useIdb from "@/hooks/useIdb"
import type { Note as NoteType } from "@filen/sdk-rs"
import NoteContent from "./content"
import Empty from "./content/empty"

export const Note = memo(() => {
	const noteUuid = useNoteUuidFromPathname()
	const [, setDefaultNote] = useIdb<NoteType | null>("defaultNote", null)

	const notesQuery = useNotesQuery({
		enabled: false
	})

	const note = useMemo(() => {
		if (notesQuery.status !== "success" || !noteUuid) {
			return null
		}

		return notesQuery.data.find(n => n.uuid === noteUuid) ?? null
	}, [notesQuery.data, noteUuid, notesQuery.status])

	useEffect(() => {
		if (note) {
			setDefaultNote(note)
		}
	}, [note, setDefaultNote])

	if (!note) {
		return <Empty />
	}

	return <NoteContent note={note} />
})

Note.displayName = "Note"

export default Note
