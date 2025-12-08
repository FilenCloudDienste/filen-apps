import { Fragment, useState } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { Platform } from "react-native"
import { PressableScale } from "@/components/ui/pressables"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note, { type ListItem as NoteListItem } from "@/components/notes/note"
import useNotesWithContentQuery from "@/queries/useNotesWithContent.query"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import Text from "@/components/ui/text"
import { Paths } from "expo-file-system"
import Menu from "@/components/ui/menu"
import View from "@/components/ui/view"

export const Notes = memo(() => {
	const notesQuery = useNotesWithContentQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))
	const [searchQuery, setSearchQuery] = useState<string>("")

	const notes = useMemo((): NoteListItem[] => {
		if (notesQuery.status !== "success") {
			return []
		}

		const grouped = notesSorter
			.group({
				notes: notesQuery.data,
				groupArchived: true,
				groupTrashed: true,
				groupFavorited: true,
				groupPinned: true
			})
			.filter(n => n.type === "note")

		if (searchQuery.trim() === "") {
			return grouped
		}

		return grouped.filter(note => {
			const query = searchQuery.toLowerCase().trim()

			return (
				(note.title?.toLowerCase().trim().includes(query) ?? false) || (note.content?.toLowerCase().trim().includes(query) ?? false)
			)
		})
	}, [notesQuery.data, notesQuery.status, searchQuery])

	const renderItem = useCallback(
		(info: ListRenderItemInfo<NoteListItem>) => {
			return (
				<Note
					info={info}
					nextNote={notes[info.index + 1]}
					prevNote={notes[info.index - 1]}
				/>
			)
		},
		[notes]
	)

	const keyExtractor = useCallback((note: NoteListItem) => {
		return note.type === "header" ? note.id : note.uuid
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
				transparent={Platform.OS === "ios"}
				title={selectedNotes.length > 0 ? `${selectedNotes.length} tbd_selected` : "tbd_notes"}
				left={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					const onlyNotes = notes.filter(n => n.type === "note")

					return (
						<PressableScale
							hitSlop={20}
							onPress={() => {
								if (selectedNotes.length === onlyNotes.length) {
									useNotesStore.getState().setSelectedNotes([])

									return
								}

								useNotesStore.getState().setSelectedNotes(onlyNotes)
							}}
						>
							<Text>{selectedNotes.length === onlyNotes.length ? "tbd_deselectAll" : "tbd_selectAll"}</Text>
						</PressableScale>
					)
				}}
				right={() => {
					return (
						<Menu
							type="dropdown"
							hitSlop={20}
							buttons={[
								{
									id: "search",
									title: "tbd_search",
									icon: "search",
									onPress: () => {
										router.push(Paths.join("/", "search", "notes"))
									}
								}
							]}
						>
							<PressableScale
								hitSlop={20}
								className="w-full h-full items-center justify-center"
							>
								<Ionicons
									name="ellipsis-horizontal"
									size={24}
									color={textForeground.color as string}
								/>
							</PressableScale>
						</Menu>
					)
				}}
				searchBarOptions={{
					placeholder: "tbd_search_notes",
					onChangeText(e) {
						setSearchQuery(e.nativeEvent.text)
					},
					autoFocus: true,
					autoCapitalize: "none"
				}}
			/>
			<SafeAreaView
				edges={["left", "right"]}
				className="flex-col gap-4"
			>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-40"
					keyExtractor={keyExtractor}
					data={searchQuery.trim().length > 0 ? notes : []}
					emptyComponent={() => {
						return (
							<View className="flex-1 items-center justify-center">
								<Text>search</Text>
							</View>
						)
					}}
					renderItem={renderItem}
					onRefresh={onRefresh}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
