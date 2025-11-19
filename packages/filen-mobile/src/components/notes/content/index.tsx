import { memo, useMemo, useState, useCallback } from "react"
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

export const Loading = memo(({ children, loading, ready }: { children: React.ReactNode; loading?: boolean; ready?: boolean }) => {
	const textForeground = useResolveClassNames("text-foreground")

	const showLoader = useMemo(() => {
		if (loading) {
			return true
		}

		if (typeof ready === "boolean" && !ready) {
			return true
		}

		return false
	}, [loading, ready])

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

Loading.displayName = "Loading"

export const Content = memo(({ note }: { note: Note }) => {
	const [ready, setReady] = useState<boolean>(note.noteType === NoteType.Checklist)
	const stringifiedClient = useStringifiedClient()
	const noteContentQuery = useNoteContentQuery({
		note
	})

	const loading = useMemo(() => {
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

	const hasWriteAccess = useMemo(() => {
		if (!stringifiedClient) {
			return false
		}

		return (
			note.ownerId === stringifiedClient.userId ||
			note.participants.some(participant => participant.userId === stringifiedClient.userId && participant.permissionsWrite)
		)
	}, [stringifiedClient, note])

	const onReady = useCallback(() => {
		setReady(true)
	}, [])

	const onValueChange = useCallback((value: string) => {
		console.log("New value:", value)
	}, [])

	return (
		<Loading
			loading={loading}
			ready={ready}
		>
			{note.noteType === NoteType.Checklist ? (
				<Checklist
					initialValue={noteContentQuery.data ?? ""}
					onChange={onValueChange}
					readOnly={!hasWriteAccess}
				/>
			) : (
				<TextEditor
					key={noteContentQuery.dataUpdatedAt}
					initialValue={noteContentQuery.data ?? ""}
					onReady={onReady}
					onValueChange={onValueChange}
					readOnly={!hasWriteAccess}
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
})

Content.displayName = "NotesContent"

export default Content
