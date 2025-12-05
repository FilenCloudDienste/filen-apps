import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { type Note as TNote } from "@filen/sdk-rs"
import { run, cn } from "@filen/utils"
import alerts from "@/lib/alerts"
import { Platform } from "react-native"
import { PressableOpacity } from "@/components/ui/pressables"
import { useRouter } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note from "@/components/notes/note"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import Text from "@/components/ui/text"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { Paths } from "expo-file-system"
import Menu from "@/components/ui/menu"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))

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
				transparent={Platform.OS === "ios"}
				title={selectedNotes.length > 0 ? `${selectedNotes.length} tbd_selected` : "tbd_notes"}
				left={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					return (
						<AnimatedView
							className="px-2 flex-row items-center"
							entering={FadeIn}
							exiting={FadeOut}
						>
							<PressableOpacity
								onPress={() => {
									if (selectedNotes.length === notes.length) {
										useNotesStore.getState().setSelectedNotes([])

										return
									}

									useNotesStore.getState().setSelectedNotes(notes)
								}}
							>
								<Text>{selectedNotes.length === notes.length ? "tbd_deselectAll" : "tbd_selectAll"}</Text>
							</PressableOpacity>
						</AnimatedView>
					)
				}}
				right={() => {
					return (
						<AnimatedView
							className={cn(
								"flex-row items-center justify-center",
								Platform.select({
									ios: "px-1.5",
									default: ""
								})
							)}
							entering={FadeIn}
							exiting={FadeOut}
						>
							<Menu
								type="dropdown"
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
								<Ionicons
									name="ellipsis-horizontal"
									size={24}
									color={textForeground.color as string}
								/>
							</Menu>
						</AnimatedView>
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
