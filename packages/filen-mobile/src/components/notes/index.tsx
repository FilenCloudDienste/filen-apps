import { Fragment, useState } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import useNotesWithContentQuery from "@/queries/useNotesWithContent.query"
import { notesSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { type Note as TNote, NoteType, type NoteTag } from "@filen/sdk-rs"
import { run, fastLocaleCompare } from "@filen/utils"
import alerts from "@/lib/alerts"
import { Platform, TextInput } from "react-native"
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
import View, { KeyboardAvoidingView } from "@/components/ui/view"
import Text from "@/components/ui/text"

const Header = memo(
	({ withSearch, setSearchQuery }: { withSearch?: boolean; setSearchQuery?: React.Dispatch<React.SetStateAction<string>> }) => {
		const router = useRouter()
		const textForeground = useResolveClassNames("text-foreground")
		const selectedNotes = useNotesStore(useShallow(state => state.selectedNotes))
		const selectedTags = useNotesStore(useShallow(state => state.selectedTags))
		const [notesViewMode, setNotesViewMode] = useSecureStore<"notes" | "tags">("notesViewMode", "notes")
		const { tagUuid } = useLocalSearchParams<{
			tagUuid?: string
		}>()

		const notesTagsQuery = useNotesTagsQuery({
			enabled: false
		})

		const notesQuery = useNotesWithContentQuery({
			enabled: false
		})

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

		const onlyNotes = useMemo(() => {
			return notes.filter(n => n.type === "note")
		}, [notes])

		const notesTags = useMemo(() => {
			if (notesTagsQuery.status !== "success") {
				return []
			}

			return notesTagsQuery.data.sort((a, b) => fastLocaleCompare(a.name ?? a.uuid, b.name ?? b.uuid))
		}, [notesTagsQuery.data, notesTagsQuery.status])

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
			<StackHeader
				transparent={Platform.OS === "ios" && !withSearch}
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
						...(!withSearch
							? [
									{
										type: "button" as const,
										props: {
											hitSlop: 20,
											onPress: () => {
												useNotesStore.getState().setSelectedNotes([])
												useNotesStore.getState().setSelectedTags([])

												router.push({
													pathname: Paths.join("/", "search", "notes"),
													params: {
														...(tag
															? {
																	tagUuid: tag.uuid
																}
															: {})
													}
												})
											}
										},
										icon: {
											name: "search" as const,
											size: 24,
											color: textForeground.color
										}
									}
								]
							: []),
						{
							type: "menu",
							props: {
								type: "dropdown",
								hitSlop: 20,
								buttons: [
									...((notesViewMode === "notes" ? onlyNotes.length > 0 : notesTags.length > 0)
										? [
												{
													id: "selectAll",
													title: "tbd_select_all",
													icon: "select" as const,
													onPress: () => {
														if (notesViewMode === "notes") {
															useNotesStore.getState().setSelectedNotes(onlyNotes)
														} else {
															useNotesStore.getState().setSelectedTags(notesTags)
														}
													}
												}
											]
										: []),
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
									...(!tag && !withSearch
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
				searchBarOptions={
					withSearch && setSearchQuery
						? Platform.select({
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
							})
						: undefined
				}
			/>
		)
	}
)

const SearchWrapper = memo(
	({
		children,
		setSearchQuery,
		enabled
	}: {
		children: React.ReactNode
		setSearchQuery: React.Dispatch<React.SetStateAction<string>>
		enabled?: boolean
	}) => {
		if (!enabled) {
			return children
		}

		return (
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
								spellCheck={false}
								returnKeyType="search"
								autoComplete="off"
								autoFocus={true}
							/>
						</View>
					),
					default: null
				})}

				{children}
			</KeyboardAvoidingView>
		)
	}
)

export const Notes = memo(({ withSearch }: { withSearch?: boolean }) => {
	const notesQuery = useNotesWithContentQuery()
	const [searchQuery, setSearchQuery] = useState<string>("")
	const [notesViewMode] = useSecureStore<"notes" | "tags">("notesViewMode", "notes")
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

		let notes = notesSorter.group({
			notes: notesQuery.data,
			groupArchived: true,
			groupTrashed: true,
			groupFavorited: true,
			groupPinned: true,
			tag: tag ?? undefined
		})

		if (searchQuery.length > 0) {
			const searchQueryNormalized = searchQuery.trim().toLowerCase()

			notes = notes.filter(note => {
				if (note.type === "header") {
					return false
				}

				if (note.title && note.title.toLowerCase().includes(searchQueryNormalized)) {
					return true
				}

				if (note.content && note.content.toLowerCase().includes(searchQueryNormalized)) {
					return true
				}

				return false
			})
		}

		return notes
	}, [notesQuery.data, notesQuery.status, tag, searchQuery])

	const notesTags = useMemo(() => {
		if (notesTagsQuery.status !== "success") {
			return []
		}

		let notesTags = notesTagsQuery.data.sort((a, b) => fastLocaleCompare(a.name ?? a.uuid, b.name ?? b.uuid))

		if (searchQuery.length > 0) {
			const searchQueryNormalized = searchQuery.trim().toLowerCase()

			notesTags = notesTags.filter(tag => {
				if (tag.name && tag.name.toLowerCase().includes(searchQueryNormalized)) {
					return true
				}

				return false
			})
		}

		return notesTags
	}, [notesTagsQuery.data, notesTagsQuery.status, searchQuery])

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

	return (
		<Fragment>
			<Header
				withSearch={withSearch}
				setSearchQuery={setSearchQuery}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<SearchWrapper
					enabled={withSearch}
					setSearchQuery={setSearchQuery}
				>
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
				</SearchWrapper>
			</SafeAreaView>
		</Fragment>
	)
})

export default Notes
