import { memo, Fragment, useMemo } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { useLocalSearchParams, Redirect } from "expo-router"
import useNotesQuery from "@/queries/useNotes.query"
import type { Note as TNote } from "@filen/sdk-rs"
import Content from "@/components/notes/content"
import { ActivityIndicator } from "react-native"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"

export const Header = memo(({ note }: { note: TNote }) => {
	const temporaryNoteContents = useNotesStore(useShallow(state => state.temporaryContent))

	return (
		<StackHeader
			title="tbd"
			right={() => {
				if ((temporaryNoteContents[note.uuid] ?? []).length === 0) {
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
})

Header.displayName = "Header"

export const Note = memo(() => {
	const { uuid } = useLocalSearchParams<{ uuid: string }>()

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

Note.displayName = "Note"

export default Note
