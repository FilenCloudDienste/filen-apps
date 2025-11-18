import { memo, useMemo } from "react"
import { type Note, NoteType } from "@filen/sdk-rs"
import View from "@/components/ui/view"
import useNoteContentQuery from "@/queries/useNoteContent.query"
import Checklist from "@/components/notes/content/checklist"
import { FadeOut } from "react-native-reanimated"
import { AnimatedView } from "@/components/ui/animated"
import { ActivityIndicator } from "react-native"
import { useResolveClassNames } from "uniwind"
import { cn } from "@filen/utils"
import TextEditor from "@/components/textEditor"

export const Loading = memo(
	({ children, loading, hasCachedData }: { children: React.ReactNode; loading?: boolean; hasCachedData?: boolean }) => {
		const textForeground = useResolveClassNames("text-foreground")

		return (
			<View className="flex-1">
				{loading && (
					<AnimatedView
						className={cn(
							"absolute inset-0 z-9999 flex-1 items-center justify-center",
							hasCachedData ? "bg-background/50" : "bg-background"
						)}
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
	}
)

Loading.displayName = "Loading"

export const Content = memo(({ note }: { note: Note }) => {
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

	return (
		<Loading
			loading={loading}
			hasCachedData={noteContentQuery.status === "success"}
		>
			{note.noteType === NoteType.Checklist ? (
				<Checklist initialValue={noteContentQuery.data ?? ""} />
			) : (
				<TextEditor
					key={noteContentQuery.dataUpdatedAt}
					initialValue={noteContentQuery.data ?? ""}
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
				/>
			)}
		</Loading>
	)
})

Content.displayName = "NotesContent"

export default Content
