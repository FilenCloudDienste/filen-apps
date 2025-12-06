import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { type Note as TNote, NoteType } from "@filen/sdk-rs"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { PressableOpacity } from "@/components/ui/pressables"
import { useRouter, useLocalSearchParams } from "expo-router"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note from "@/components/notes/note"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import Text from "@/components/ui/text"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import prompts from "@/lib/prompts"
import notesLib from "@/lib/notes"
import { Paths } from "expo-file-system"
import Menu from "@/components/ui/menu"

export const NoteTag = memo(() => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))
	const { uuid } = useLocalSearchParams<{ uuid?: string }>()
	const notesQuery = useNotesQuery()

	const notesTagsQuery = useNotesTagsQuery({
		enabled: false
	})

	const tag = useMemo(() => {
		if (notesTagsQuery.status !== "success") {
			return null
		}

		return notesTagsQuery.data.find(t => t.uuid === uuid) ?? null
	}, [uuid, notesTagsQuery.status, notesTagsQuery.data])

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesSorter.sort(notesQuery.data).filter(note => note.tags.some(t => t.uuid === tag?.uuid))
	}, [notesQuery.data, notesQuery.status, tag])

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

	const createNote = useCallback(
		async (type: NoteType) => {
			if (!tag) {
				return
			}

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
				const note = await notesLib.create({
					title,
					content: "",
					type
				})

				await notesLib.addTag({
					note,
					tag
				})

				return note
			})

			if (!createResult.success) {
				console.error(createResult.error)
				alerts.error(createResult.error)

				return
			}

			router.push(Paths.join("/", "note", createResult.data.uuid))
		},
		[router, tag]
	)

	return (
		<Fragment>
			<Header
				title={selectedNotes.length > 0 ? `${selectedNotes.length} tbd_selected` : (tag?.name ?? tag?.uuid ?? "tbd_tag")}
				left={() => {
					if (selectedNotes.length === 0) {
						return null
					}

					return (
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
					)
				}}
				right={() => {
					return (
						<Menu
							type="dropdown"
							buttons={[
								{
									id: "create",
									title: "tbd_create_note",
									icon: "plus",
									subButtons: [
										{
											title: "tbd_text",
											id: "text",
											icon: "text",
											onPress: async () => {
												await createNote(NoteType.Text)
											}
										},
										{
											title: "tbd_checklist",
											id: "checklist",
											icon: "checklist",
											onPress: async () => {
												await createNote(NoteType.Checklist)
											}
										},
										{
											title: "tbd_markdown",
											id: "markdown",
											icon: "markdown",
											onPress: async () => {
												await createNote(NoteType.Md)
											}
										},
										{
											title: "tbd_code",
											id: "code",
											icon: "code",
											onPress: async () => {
												await createNote(NoteType.Code)
											}
										},
										{
											title: "tbd_richtext",
											id: "richtext",
											icon: "richtext",
											onPress: async () => {
												await createNote(NoteType.Rich)
											}
										}
									]
								},
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

export default NoteTag
