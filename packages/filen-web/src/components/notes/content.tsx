import { memo, useMemo, useEffect, useRef, useCallback } from "react"
import TextEditor from "../textEditor"
import useNoteContentQuery from "@/queries/useNoteContent.query"
import Header from "./header"
import pathModule from "path"
import type { Note as NoteType } from "@filen/sdk-rs"
import Checklist from "./checklist"
import { Navigate } from "@tanstack/react-router"
import { useAuth } from "@/hooks/useAuth"
import useNotesStore from "@/stores/notes.store"
import Semaphore from "@/lib/semaphore"
import toasts from "@/lib/toasts"
import notes from "@/lib/notes"
import useKeyPress from "@/hooks/useKeyPress"
import { createExecutableTimeout } from "@/lib/utils"

export const editMutex = new Semaphore(1)

export const NoteContent = memo(({ note }: { note: NoteType }) => {
	const lastNoteContentRef = useRef<string | undefined>(undefined)
	const lastNoteContentQueryDataUpdatedAtRef = useRef<number>(0)
	const { client } = useAuth()
	const onValueChangeTimeoutRef = useRef<ReturnType<typeof createExecutableTimeout> | null>(null)

	const noteContentQuery = useNoteContentQuery({
		uuid: note.uuid
	})

	const noteContent = useMemo(() => {
		if (noteContentQuery.status !== "success") {
			return ""
		}

		return noteContentQuery.data ?? ""
	}, [noteContentQuery.data, noteContentQuery.status])

	const fileName = useMemo(() => {
		if (!note) {
			return "untitled.txt"
		}

		if (note.noteType === "md") {
			return `${note.title}.md`
		}

		if (note.noteType === "code") {
			const ext = pathModule.posix.extname(note.title ?? "file.tsx")

			return ext.length > 1 ? note.title : `${note.title}.tsx`
		}

		return `${note.title}.txt`
	}, [note])

	const isFetching = useMemo(() => {
		return (
			noteContentQuery.isRefetching ||
			noteContentQuery.isLoading ||
			noteContentQuery.isFetching ||
			noteContentQuery.isPending ||
			noteContentQuery.isError ||
			noteContentQuery.isRefetchError ||
			noteContentQuery.isLoadingError
		)
	}, [
		noteContentQuery.isError,
		noteContentQuery.isFetching,
		noteContentQuery.isLoading,
		noteContentQuery.isLoadingError,
		noteContentQuery.isPending,
		noteContentQuery.isRefetchError,
		noteContentQuery.isRefetching
	])

	const canEdit = useMemo(() => {
		if (!note) {
			return false
		}

		if (isFetching) {
			return false
		}

		return note.ownerId === client?.userId || note.participants.some(p => p.userId === client?.userId && p.permissionsWrite)
	}, [isFetching, note, client])

	const onValueChange = useCallback(
		(value: string) => {
			if (!note || !canEdit) {
				return
			}

			useNotesStore.getState().setSyncing(note)

			onValueChangeTimeoutRef.current?.cancel()

			onValueChangeTimeoutRef.current = createExecutableTimeout(async () => {
				await editMutex.acquire()

				try {
					if (
						lastNoteContentRef.current &&
						Buffer.from(value, "utf-8").toString("hex") === Buffer.from(lastNoteContentRef.current, "utf-8").toString("hex")
					) {
						return
					}

					await notes.setContent(note, value)

					lastNoteContentRef.current = value
				} catch (e) {
					console.error(e)
					toasts.error(e)
				} finally {
					editMutex.release()

					useNotesStore.getState().setSyncing(null)
				}
			}, 2500)
		},
		[canEdit, note]
	)

	useKeyPress({
		key: "s",
		modifiers: ["Control", "Meta"],
		onKeyPress: e => {
			if (!onValueChangeTimeoutRef.current) {
				return
			}

			e.preventDefault()
			e.stopPropagation()

			onValueChangeTimeoutRef.current.execute()
		}
	})

	useEffect(() => {
		if (noteContentQuery.status !== "success") {
			return
		}

		if (noteContentQuery.dataUpdatedAt <= lastNoteContentQueryDataUpdatedAtRef.current) {
			return
		}

		lastNoteContentQueryDataUpdatedAtRef.current = noteContentQuery.dataUpdatedAt
		lastNoteContentRef.current = noteContentQuery.data
	}, [noteContentQuery.status, noteContentQuery.data, noteContentQuery.dataUpdatedAt])

	if (noteContentQuery.status !== "success") {
		return (
			<div
				className="flex flex-1 w-full h-full flex-col overflow-hidden"
				key={`${note.uuid}:${noteContentQuery.dataUpdatedAt}`}
			>
				<Header note={note} />
				<div>loading...</div>
			</div>
		)
	}

	if (note.noteType === "text" || note.noteType === "md" || note.noteType === "code" || note.noteType === "rich") {
		return (
			<div className="flex flex-1 w-full h-full flex-col overflow-hidden">
				<Header note={note} />
				<div className="flex flex-1 flex-row overflow-x-hidden overflow-y-auto h-full w-full rounded-b-lg">
					{isFetching && (
						<div className="flex flex-1 w-full h-full absolute top-0 left-0 right-0 bottom-0 bg-background opacity-50 rounded-lg z-[9999] pointer-events-none cursor-progress" />
					)}
					<TextEditor
						key={`${note.uuid}:${noteContentQuery.dataUpdatedAt}`}
						initialValue={noteContent}
						onValueChange={onValueChange}
						richText={note.noteType === "rich"}
						editable={canEdit}
						fileName={fileName}
					/>
				</div>
			</div>
		)
	}

	if (note.noteType === "checklist") {
		return (
			<div className="flex flex-1 w-full h-full flex-col overflow-hidden">
				<Header note={note} />
				<div className="flex flex-1 flex-row overflow-x-hidden overflow-y-auto h-full w-full rounded-b-lg">
					{isFetching && (
						<div className="flex flex-1 w-full h-full absolute top-0 left-0 right-0 bottom-0 bg-background opacity-50 rounded-lg z-[9999] pointer-events-none cursor-progress" />
					)}
					<Checklist
						key={`${note.uuid}:${noteContentQuery.dataUpdatedAt}`}
						initialValue={
							noteContent.length === 0 || noteContent.indexOf("<ul data-checked") === -1 || noteContent === "<p><br></p>"
								? // eslint-disable-next-line quotes
									'<ul data-checked="false"><li><br></li></ul>'
								: noteContent
						}
						onValueChange={onValueChange}
						editable={canEdit}
					/>
				</div>
			</div>
		)
	}

	return <Navigate to="/notes" />
})

NoteContent.displayName = "NoteContent"

export default NoteContent
