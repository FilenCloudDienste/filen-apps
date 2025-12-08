import { Fragment, useState } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note, { type ListItem as NoteListItem } from "@/components/notes/note"
import useNotesWithContentQuery from "@/queries/useNotesWithContent.query"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import Text from "@/components/ui/text"
import { Paths } from "expo-file-system"
import View, { KeyboardAvoidingView } from "@/components/ui/view"
import { Platform, TextInput } from "react-native"

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
				transparent={false}
				shadowVisible={false}
				title={selectedNotes.length > 0 ? `${selectedNotes.length} tbd_selected` : "tbd_notes"}
				leftItems={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					const onlyNotes = notes.filter(n => n.type === "note")

					return [
						{
							type: "button",
							props: {
								hitSlop: 20,
								onPress: () => {
									if (selectedNotes.length === onlyNotes.length) {
										useNotesStore.getState().setSelectedNotes([])

										return
									}

									useNotesStore.getState().setSelectedNotes(onlyNotes)
								}
							},
							text: {
								children: selectedNotes.length === onlyNotes.length ? "tbd_deselectAll" : "tbd_selectAll"
							}
						}
					]
				}}
				rightItems={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					return [
						{
							type: "menu",
							props: {
								type: "dropdown",
								hitSlop: 20,
								buttons: [
									{
										id: "search",
										title: "tbd_search",
										icon: "search",
										onPress: () => {
											router.push(Paths.join("/", "search", "notes"))
										}
									}
								]
							},
							icon: {
								name: "ellipsis-horizontal",
								size: 24,
								color: textForeground.color
							},
							triggerProps: {
								hitSlop: 20
							}
						}
					]
				}}
				searchBarOptions={Platform.select({
					ios: {
						placeholder: "tbd_search_notes",
						onChangeText(e) {
							setSearchQuery(e.nativeEvent.text)
						},
						autoFocus: true,
						autoCapitalize: "none",
						placement: "stacked"
					},
					default: undefined
				})}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<KeyboardAvoidingView
					className="flex-1 flex-col"
					behavior="padding"
				>
					{Platform.select({
						android: (
							<View className="px-4 py-2 shrink-0">
								<TextInput
									className="bg-background-secondary px-5 py-4 rounded-full"
									placeholder="tbd_search_notes"
									onChangeText={setSearchQuery}
									autoCapitalize="none"
									autoCorrect={false}
									returnKeyType="search"
									autoComplete="off"
									autoFocus={true}
								/>
							</View>
						),
						default: null
					})}
					<VirtualList
						className="flex-1"
						contentInsetAdjustmentBehavior="automatic"
						contentContainerClassName="pb-40 pt-4"
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
				</KeyboardAvoidingView>
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
