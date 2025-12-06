import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { type Note as TNote, NoteType, type NoteTag } from "@filen/sdk-rs"
import { run, fastLocaleCompare } from "@filen/utils"
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
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import prompts from "@/lib/prompts"
import notesLib from "@/lib/notes"
import { Paths } from "expo-file-system"
import Menu from "@/components/ui/menu"
import { useSecureStore } from "@/lib/secureStore"
import Tag from "@/components/notes/tag"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))
	const selectedTags = useNotesStore(useShallow(state => state.selectedTags))
	const notesTagsQuery = useNotesTagsQuery()
	const [notesViewMode, setNotesViewMode] = useSecureStore<"notes" | "tags">("notesViewMode", "notes")

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesSorter.sort(notesQuery.data)
	}, [notesQuery.data, notesQuery.status])

	const notesTags = useMemo(() => {
		if (notesTagsQuery.status !== "success") {
			return []
		}

		return notesTagsQuery.data.sort((a, b) => fastLocaleCompare(a.name ?? a.uuid, b.name ?? b.uuid))
	}, [notesTagsQuery.data, notesTagsQuery.status])

	const notesForTag = useMemo<Record<string, TNote[]>>(() => {
		if (notesQuery.status !== "success" || notesTagsQuery.status !== "success") {
			return {}
		}

		return notesTagsQuery.data.reduce(
			(acc, tag) => {
				acc[tag.uuid] = notesQuery.data.filter(n => n.tags.some(t => t.uuid === tag.uuid))

				return acc
			},
			{} as Record<string, TNote[]>
		)
	}, [notesQuery.data, notesQuery.status, notesTagsQuery.data, notesTagsQuery.status])

	const renderItemNotesView = useCallback((info: ListRenderItemInfo<TNote>) => {
		return <Note info={info} />
	}, [])

	const renderItemTagsView = useCallback(
		(info: ListRenderItemInfo<NoteTag>) => {
			return (
				<Tag
					info={info}
					notesForTag={notesForTag[info.item.uuid] ?? []}
				/>
			)
		},
		[notesForTag]
	)

	const keyExtractorNotesView = useCallback((note: TNote) => {
		return note.uuid
	}, [])

	const keyExtractorTagsView = useCallback((tag: NoteTag) => {
		return tag.uuid
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
					type
				})
			})

			if (!createResult.success) {
				console.error(createResult.error)
				alerts.error(createResult.error)

				return
			}

			router.push(Paths.join("/", "note", createResult.data.uuid))
		},
		[router]
	)

	return (
		<Fragment>
			<Header
				transparent={Platform.OS === "ios"}
				blurEffect="systemChromeMaterial"
				title={
					notesViewMode === "notes"
						? selectedNotes.length > 0
							? `${selectedNotes.length} tbd_selected`
							: "tbd_notes"
						: selectedTags.length > 0
							? `${selectedTags.length} tbd_selected`
							: "tbd_tags"
				}
				leftClassName="w-auto px-2"
				left={() => {
					if (selectedNotes.length === 0 && selectedTags.length === 0) {
						return null
					}

					return (
						<PressableOpacity
							className="w-full"
							hitSlop={15}
							onPress={() => {
								if (notesViewMode === "notes") {
									if (selectedNotes.length === notes.length) {
										useNotesStore.getState().setSelectedNotes([])

										return
									}

									useNotesStore.getState().setSelectedNotes(notes)
								} else {
									if (selectedTags.length === notesTags.length) {
										useNotesStore.getState().setSelectedTags([])

										return
									}

									useNotesStore.getState().setSelectedTags(notesTags)
								}
							}}
						>
							<Text
								ellipsizeMode="tail"
								numberOfLines={1}
								className="w-full"
							>
								{notesViewMode === "notes"
									? selectedNotes.length === notes.length
										? "tbd_deselectAll"
										: "tbd_selectAll"
									: selectedTags.length === notesTags.length
										? "tbd_deselectAll"
										: "tbd_selectAll"}
							</Text>
						</PressableOpacity>
					)
				}}
				right={() => {
					return (
						<Menu
							type="dropdown"
							hitSlop={15}
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
									id: "viewMode",
									title: "tbd_viewMode",
									icon: notesViewMode === "notes" ? "list" : "tag",
									subButtons: [
										{
											title: "tbd_notes_view",
											id: "notesView",
											icon: "list",
											checked: notesViewMode === "notes",
											onPress: () => {
												setNotesViewMode("notes")
											}
										},
										{
											title: "tbd_tags_view",
											id: "tagsView",
											icon: "tag",
											checked: notesViewMode === "tags",
											onPress: () => {
												setNotesViewMode("tags")
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
							<PressableOpacity
								hitSlop={20}
								className="w-full h-full items-center justify-center"
							>
								<Ionicons
									name="ellipsis-horizontal"
									size={24}
									color={textForeground.color as string}
								/>
							</PressableOpacity>
						</Menu>
					)
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				{notesViewMode === "notes" ? (
					<VirtualList
						className="flex-1"
						contentInsetAdjustmentBehavior="automatic"
						contentContainerClassName="pb-40"
						keyExtractor={keyExtractorNotesView}
						data={notes}
						renderItem={renderItemNotesView}
						onRefresh={onRefresh}
					/>
				) : (
					<VirtualList
						className="flex-1"
						contentInsetAdjustmentBehavior="automatic"
						contentContainerClassName="pb-40"
						keyExtractor={keyExtractorTagsView}
						data={notesTags}
						renderItem={renderItemTagsView}
						onRefresh={onRefresh}
					/>
				)}
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
