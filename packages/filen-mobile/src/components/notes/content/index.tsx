import { memo, useMemo, useCallback } from "@/lib/memo"
import { type Note, NoteType } from "@filen/sdk-rs"
import View from "@/components/ui/view"
import useNoteContentQuery from "@/queries/useNoteContent.query"
import Checklist from "@/components/notes/content/checklist"
import { FadeOut } from "react-native-reanimated"
import { AnimatedView } from "@/components/ui/animated"
import { ActivityIndicator } from "react-native"
import { useResolveClassNames } from "uniwind"
import TextEditor from "@/components/textEditor"
import { useStringifiedClient } from "@/lib/auth"
import useNotesStore from "@/stores/useNotes.store"
import useTextEditorStore from "@/stores/useTextEditor.store"
import { useShallow } from "zustand/shallow"
import isEqual from "react-fast-compare"

export const Loading = memo(({ children, loading, noteType }: { children: React.ReactNode; loading?: boolean; noteType: NoteType }) => {
	const textForeground = useResolveClassNames("text-foreground")
	const textEditorReady = useTextEditorStore(useShallow(state => state.ready))

	const showLoader = useMemo(() => {
		if (noteType === NoteType.Checklist) {
			return loading
		}

		return loading || !textEditorReady
	}, [loading, textEditorReady, noteType])

	return (
		<View className="flex-1">
			{showLoader && (
				<AnimatedView
					className="absolute inset-0 z-9999 flex-1 items-center justify-center bg-background/50"
					exiting={FadeOut}
				>
					<ActivityIndicator
						size="large"
						color={textForeground.color as string}
					/>
				</AnimatedView>
			)}
			{children}
		</View>
	)
})

export const Content = memo(
	({ note }: { note: Note }) => {
		const stringifiedClient = useStringifiedClient()
		const noteContentQuery = useNoteContentQuery({
			note
		})

		const initialValue = useMemo(() => {
			if (noteContentQuery.status !== "success") {
				return null
			}

			return noteContentQuery.data
		}, [noteContentQuery.data, noteContentQuery.status])

		const loading = useMemo(() => {
			return (
				noteContentQuery.isRefetching ||
				noteContentQuery.isLoading ||
				noteContentQuery.isFetching ||
				noteContentQuery.isPending ||
				noteContentQuery.isError ||
				noteContentQuery.isRefetchError ||
				noteContentQuery.isLoadingError ||
				typeof initialValue !== "string"
			)
		}, [
			noteContentQuery.isError,
			noteContentQuery.isFetching,
			noteContentQuery.isLoading,
			noteContentQuery.isLoadingError,
			noteContentQuery.isPending,
			noteContentQuery.isRefetchError,
			noteContentQuery.isRefetching,
			initialValue
		])

		const hasWriteAccess = useMemo(() => {
			if (!stringifiedClient) {
				return false
			}

			return (
				note.ownerId === stringifiedClient.userId ||
				note.participants.some(participant => participant.userId === stringifiedClient.userId && participant.permissionsWrite)
			)
		}, [stringifiedClient, note])

		const onValueChange = useCallback(
			(value: string) => {
				const now = Date.now()

				useNotesStore.getState().setTemporaryContent(prev => ({
					...prev,
					[note.uuid]: [
						{
							timestamp: now,
							note,
							content: value
						},
						...(prev[note.uuid] ?? []).filter(c => c.timestamp >= now)
					]
				}))
			},
			[note]
		)

		return (
			<Loading
				loading={loading}
				noteType={note.noteType}
			>
				{note.noteType === NoteType.Checklist ? (
					<Checklist
						initialValue={initialValue ?? ""}
						onChange={onValueChange}
						readOnly={!hasWriteAccess}
						autoFocus={hasWriteAccess && (initialValue ?? "").length === 0}
					/>
				) : (
					<TextEditor
						// Needs a key to reset the editor when the note changes, somehow expo-dom compontents does not update the state properly
						key={noteContentQuery.dataUpdatedAt}
						initialValue={initialValue ?? ""}
						onValueChange={onValueChange}
						readOnly={!hasWriteAccess}
						autoFocus={hasWriteAccess && (initialValue ?? "").length === 0}
						placeholder="tbd_placeholder"
						type={
							note.noteType === NoteType.Text
								? "text"
								: note.noteType === NoteType.Code
									? "code"
									: note.noteType === NoteType.Md
										? "markdown"
										: note.noteType === NoteType.Rich
											? "richtext"
											: "text"
						}
						id={`note:${note.uuid}`}
					/>
				)}
			</Loading>
		)
	},
	(prevProps, nextProps) => {
		// We have to manually prevent re-renders here, otherwise the text editor will re-render on every note state change
		return (
			prevProps.note.uuid === nextProps.note.uuid &&
			isEqual(prevProps.note.participants, nextProps.note.participants) &&
			prevProps.note.ownerId === nextProps.note.ownerId &&
			prevProps.note.noteType === nextProps.note.noteType
		)
	}
)

export default Content
