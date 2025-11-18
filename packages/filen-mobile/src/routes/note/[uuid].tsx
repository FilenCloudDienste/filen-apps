import { memo, Fragment, useMemo } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { useLocalSearchParams, Redirect } from "expo-router"
import useNotesQuery from "@/queries/useNotes.query"
import type { Note as TNote } from "@filen/sdk-rs"
import Content from "@/components/notes/content"

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
			<Header title="tbd" />
			<SafeAreaView edges={["left", "right"]}>
				<Content note={note} />
			</SafeAreaView>
		</Fragment>
	)
})

Note.displayName = "Note"

export default Note
