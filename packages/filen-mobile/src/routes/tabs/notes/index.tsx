import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import VirtualList from "@/components/ui/virtualList"
import type { Note as TNote } from "@filen/sdk-rs"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import type { ListRenderItemInfo } from "react-native"
import { AndroidIconButton } from "@/components/ui/pressables"
import { useRouter } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note from "@/components/notes/note"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesSorter.sort(notesQuery.data)
	}, [notesQuery.data, notesQuery.status])

	const renderItem = useCallback((info: ListRenderItemInfo<TNote>) => {
		return <Note info={info} />
	}, [])

	const keyExtractor = useCallback((note: TNote) => {
		return note.uuid
	}, [])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await notesQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [notesQuery])

	return (
		<Fragment>
			<Header
				title="tbd"
				right={() => {
					return (
						<AndroidIconButton
							onPress={() => {
								router.push("/search/notes")
							}}
						>
							<MaterialIcons
								name="search"
								size={24}
								color={textForeground.color as string}
							/>
						</AndroidIconButton>
					)
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-40"
					keyExtractor={keyExtractor}
					data={notes}
					renderItem={renderItem}
					onRefresh={onRefresh}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
