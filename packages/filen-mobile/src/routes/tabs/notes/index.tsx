import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import VirtualList from "@/components/ui/virtualList"
import { type Note as TNote, NoteType } from "@filen/sdk-rs"
import { run, fastLocaleCompare } from "@filen/utils"
import alerts from "@/lib/alerts"
import type { ListRenderItemInfo } from "react-native"
import { PressableOpacity } from "@/components/ui/pressables"
import { useRouter } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note from "@/components/notes/note"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import Text from "@/components/ui/text"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import prompts from "@/lib/prompts"
import notesLib from "@/lib/notes"
import { Paths } from "expo-file-system"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selected))
	const notesTagsQuery = useNotesTagsQuery()

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesSorter.sort(notesQuery.data)
	}, [notesQuery.data, notesQuery.status])

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const notesTags = useMemo(() => {
		if (notesTagsQuery.status !== "success") {
			return []
		}

		return notesTagsQuery.data.sort((a, b) => fastLocaleCompare(a.name ?? a.uuid, b.name ?? b.uuid))
	}, [notesTagsQuery.data, notesTagsQuery.status])

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
				title={selectedNotes.length > 0 ? `${selectedNotes.length} tbd_selected` : "tbd_notes"}
				left={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					return (
						<AnimatedView
							className="pr-4"
							entering={FadeIn}
							exiting={FadeOut}
						>
							<PressableOpacity
								onPress={() => {
									if (selectedNotes.length === notes.length) {
										useNotesStore.getState().setSelected([])

										return
									}

									useNotesStore.getState().setSelected(notes)
								}}
							>
								<Text>{selectedNotes.length === notes.length ? "tbd_deselectAll" : "tbd_selectAll"}</Text>
							</PressableOpacity>
						</AnimatedView>
					)
				}}
				right={() => {
					if (selectedNotes.length > 0) {
						return (
							<AnimatedView
								className="pl-4"
								entering={FadeIn}
								exiting={FadeOut}
							>
								<PressableOpacity
									onPress={() => {
										useNotesStore.getState().setSelected(notes)
									}}
								>
									<MaterialIcons
										name="more"
										size={24}
										color={textForeground.color as string}
									/>
								</PressableOpacity>
							</AnimatedView>
						)
					}

					return (
						<AnimatedView
							className="pl-4 flex-row items-center gap-4"
							entering={FadeIn}
							exiting={FadeOut}
						>
							<PressableOpacity
								onPress={async () => {
									const result = await run(async () => {
										return await prompts.input({
											title: "tbd_create_note",
											message: "tbd_enter_note_name",
											cancelText: "tbd_cancel",
											okText: "tbd_create"
										})
									})

									if (!result.success) {
										console.error(result.error)
										alerts.error(result.error)

										return
									}

									if (result.data.cancelled || result.data.type !== "string") {
										return
									}

									const title = result.data.value.trim()

									if (title.length === 0) {
										return
									}

									const createResult = await runWithLoading(async () => {
										return await notesLib.create({
											title,
											content: "",
											type: NoteType.Text
										})
									})

									if (!createResult.success) {
										console.error(createResult.error)
										alerts.error(createResult.error)

										return
									}

									router.push(Paths.join("/", "note", createResult.data.uuid))
								}}
							>
								<MaterialIcons
									name="add"
									size={24}
									color={textForeground.color as string}
								/>
							</PressableOpacity>
							<PressableOpacity
								onPress={() => {
									router.push("/search/notes")
								}}
							>
								<MaterialIcons
									name="search"
									size={24}
									color={textForeground.color as string}
								/>
							</PressableOpacity>
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
