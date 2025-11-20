import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { useLocalSearchParams, Redirect } from "expo-router"
import useNotesQuery from "@/queries/useNotes.query"
import type { Note as TNote } from "@filen/sdk-rs"
import Content from "@/components/notes/content"
import { ActivityIndicator } from "react-native"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import { memo, useMemo } from "@/lib/memo"

export const Header = memo(
	({ note }: { note: TNote }) => {
		const isSyncing = useNotesStore(useShallow(state => (state.temporaryContent[note.uuid] ?? []).length > 0))

		return (
			<StackHeader
				title="tbd"
				right={() => {
					if (!isSyncing) {
						return null
					}

					return (
						<ActivityIndicator
							size="small"
							color="white"
						/>
					)
				}}
			/>
		)
	},
	(prevProps, nextProps) => {
		// Only re-render if the note UUID changes
		return prevProps.note.uuid === nextProps.note.uuid
	}
)

export const Note = memo(() => {
	const { uuid } = useLocalSearchParams<{
		uuid: string
	}>()

	const notesQuery = useNotesQuery({
		enabled: false
	})

	const note = useMemo(() => {
		return notesQuery.data?.find(n => n.uuid === uuid) as TNote
	}, [notesQuery.data, uuid])

	if (!(note as TNote | undefined)) {
		return <Redirect href="/tabs/notes" />
	}

	return (
		<Fragment>
			<Header note={note} />
			<SafeAreaView edges={["left", "right"]}>
				<Content note={note} />
			</SafeAreaView>
		</Fragment>
	)
})

export default Note
