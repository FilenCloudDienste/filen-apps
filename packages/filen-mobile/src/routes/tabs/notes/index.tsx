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
import { useRouter, useLocalSearchParams } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { memo, useCallback, useMemo } from "@/lib/memo"
import Note, { type ListItem as NoteListItem } from "@/components/notes/note"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import prompts from "@/lib/prompts"
import notesLib from "@/lib/notes"
import { Paths } from "expo-file-system"
import { useSecureStore } from "@/lib/secureStore"
import Tag from "@/components/notes/tag"
import View from "@/components/ui/view"
import Text from "@/components/ui/text"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))
	const selectedTags = useNotesStore(useShallow(state => state.selectedTags))
	const [notesViewMode, setNotesViewMode] = useSecureStore<"notes" | "tags">("notesViewMode", "notes")
	const { tagUuid } = useLocalSearchParams<{
		tagUuid?: string
	}>()
	const notesTagsQuery = useNotesTagsQuery()

	const tag = useMemo(() => {
		if (notesTagsQuery.status !== "success" || !tagUuid) {
			return null
		}

		return notesTagsQuery.data.find(t => t.uuid === tagUuid) ?? null
	}, [tagUuid, notesTagsQuery.status, notesTagsQuery.data])

	const notes = useMemo((): NoteListItem[] => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesSorter.group({
			notes: notesQuery.data,
			groupArchived: true,
			groupTrashed: true,
			groupFavorited: true,
			groupPinned: true,
			tag: tag ?? undefined
		})
	}, [notesQuery.data, notesQuery.status, tag])

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

	const renderItemNotesView = useCallback(
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

	const keyExtractorNotesView = useCallback((note: NoteListItem) => {
		return note.type === "header" ? note.id : note.uuid
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
				const newNote = await notesLib.create({
					title,
					content: "",
					type
				})

				if (tag) {
					await notesLib.addTag({
						note: newNote,
						tag
					})
				}

				return newNote
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

	const createTag = useCallback(async () => {
		const result = await run(async () => {
			return await prompts.input({
				title: "tbd_create_tag",
				message: "tbd_enter_tag_name",
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

		const tagName = result.data.value.trim()

		if (tagName.length === 0) {
			return
		}

		const createResult = await runWithLoading(async () => {
			return await notesLib.createTag({
				name: tagName
			})
		})

		if (!createResult.success) {
			console.error(createResult.error)
			alerts.error(createResult.error)

			return
		}
	}, [])

	return (
		<Fragment>
			<Header
				transparent={Platform.OS === "ios"}
				title={
					notesViewMode === "notes"
						? selectedNotes.length > 0
							? `${selectedNotes.length} tbd_selected`
							: "tbd_notes"
						: selectedTags.length > 0
							? `${selectedTags.length} tbd_selected`
							: "tbd_tags"
				}
				leftItems={() => {
					if (selectedNotes.length === 0 && selectedTags.length === 0) {
						return null
					}

					const onlyNotes = notes.filter(n => n.type === "note")

					return [
						{
							type: "button",
							props: {
								hitSlop: 20,
								onPress: () => {
									if (notesViewMode === "notes") {
										if (selectedNotes.length === onlyNotes.length) {
											useNotesStore.getState().setSelectedNotes([])

											return
										}

										useNotesStore.getState().setSelectedNotes(onlyNotes)
									} else {
										if (selectedTags.length === notesTags.length) {
											useNotesStore.getState().setSelectedTags([])

											return
										}

										useNotesStore.getState().setSelectedTags(notesTags)
									}
								}
							},
							text: {
								children:
									notesViewMode === "notes"
										? selectedNotes.length === onlyNotes.length
											? "tbd_deselectAll"
											: "tbd_selectAll"
										: selectedTags.length === notesTags.length
											? "tbd_deselectAll"
											: "tbd_selectAll"
							}
						}
					]
				}}
				rightItems={() => {
					return [
						{
							type: "button",
							props: {
								hitSlop: 20,
								onPress: () => {
									useNotesStore.getState().setSelectedNotes([])
									useNotesStore.getState().setSelectedTags([])

									router.push(Paths.join("/", "search", "notes"))
								}
							},
							icon: {
								name: "search",
								size: 24,
								color: textForeground.color
							}
						},
						{
							type: "menu",
							props: {
								type: "dropdown",
								hitSlop: 20,
								buttons: [
									...(notesViewMode === "notes" || !!tag
										? [
												{
													id: "create",
													title: "tbd_create_note",
													icon: "plus" as const,
													subButtons: [
														{
															title: "tbd_text",
															id: "text",
															icon: "text" as const,
															onPress: async () => {
																await createNote(NoteType.Text)
															}
														},
														{
															title: "tbd_checklist",
															id: "checklist",
															icon: "checklist" as const,
															onPress: async () => {
																await createNote(NoteType.Checklist)
															}
														},
														{
															title: "tbd_markdown",
															id: "markdown",
															icon: "markdown" as const,
															onPress: async () => {
																await createNote(NoteType.Md)
															}
														},
														{
															title: "tbd_code",
															id: "code",
															icon: "code" as const,
															onPress: async () => {
																await createNote(NoteType.Code)
															}
														},
														{
															title: "tbd_richtext",
															id: "richtext",
															icon: "richtext" as const,
															onPress: async () => {
																await createNote(NoteType.Rich)
															}
														}
													]
												}
											]
										: []),
									{
										id: "createTag",
										title: "tbd_create_tag",
										icon: "plus" as const,
										onPress: async () => {
											await createTag()
										}
									},
									...(!tag
										? [
												{
													id: "viewMode",
													title: "tbd_viewMode",
													icon: notesViewMode === "notes" ? ("list" as const) : ("tag" as const),
													subButtons: [
														{
															title: "tbd_notes_view",
															id: "notesView",
															icon: "list" as const,
															checked: notesViewMode === "notes",
															onPress: () => {
																setNotesViewMode("notes")
															}
														},
														{
															title: "tbd_tags_view",
															id: "tagsView",
															icon: "tag" as const,
															checked: notesViewMode === "tags",
															onPress: () => {
																setNotesViewMode("tags")
															}
														}
													]
												}
											]
										: [])
								]
							},
							triggerProps: {
								hitSlop: 20
							},
							icon: {
								name: "ellipsis-horizontal",
								size: 24,
								color: textForeground.color
							}
						}
					]
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				{notesViewMode === "notes" || !!tag ? (
					<VirtualList
						className="flex-1"
						contentInsetAdjustmentBehavior="automatic"
						contentContainerClassName="pb-40"
						keyExtractor={keyExtractorNotesView}
						data={notes}
						renderItem={renderItemNotesView}
						onRefresh={onRefresh}
						emptyComponent={() => {
							return (
								<View className="flex-1 items-center justify-center">
									<Text>tbd</Text>
								</View>
							)
						}}
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
						emptyComponent={() => {
							return (
								<View className="flex-1 items-center justify-center">
									<Text>tbd</Text>
								</View>
							)
						}}
					/>
				)}
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
