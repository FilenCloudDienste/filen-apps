import { type Note as TNote, NoteType, type NoteTag, type NoteParticipant } from "@filen/sdk-rs"
import { Menu as MenuComponent, type MenuButton } from "@/components/ui/menu"
import { memo, useMemo, useCallback } from "@/lib/memo"
import View from "@/components/ui/view"
import { useStringifiedClient } from "@/lib/auth"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import notes from "@/lib/notes"
import prompts from "@/lib/prompts"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import useNoteHistoryQuery from "@/queries/useNoteHistory.query"
import { simpleDate } from "@/lib/time"
import { actionSheet } from "@/providers/actionSheet.provider"

export type NoteMenuOrigin = "notes" | "search" | "content"

export const Menu = memo(
	({
		children,
		origin,
		note,
		...rest
	}: {
		children: React.ReactNode
		note: TNote
		origin: NoteMenuOrigin
	} & Pick<
		React.ComponentPropsWithoutRef<typeof MenuComponent>,
		| "isAnchoredToRight"
		| "onCloseMenu"
		| "onOpenMenu"
		| "hitSlop"
		| "testID"
		| "themeVariant"
		| "className"
		| "style"
		| "type"
		| "disabled"
		| "shouldOpenOnLongPress"
		| "title"
	>) => {
		const stringifiedClient = useStringifiedClient()
		const isSelected = useNotesStore(useShallow(state => state.selected.some(selectedNote => selectedNote.uuid === note.uuid)))
		const isActive = useNotesStore(useShallow(state => state.active?.uuid === note.uuid))

		const notesTagsQuery = useNotesTagsQuery({
			enabled: false
		})

		const noteHistoryQuery = useNoteHistoryQuery(
			{
				note
			},
			{
				enabled: isActive
			}
		)

		const noteHistory = useMemo(() => {
			if (noteHistoryQuery.status !== "success") {
				return []
			}

			return noteHistoryQuery.data.sort((a, b) => Number(b.editedTimestamp) - Number(a.editedTimestamp))
		}, [noteHistoryQuery.data, noteHistoryQuery.status])

		const notesTags = useMemo(() => {
			if (notesTagsQuery.status !== "success") {
				return []
			}

			return notesTagsQuery.data
		}, [notesTagsQuery.data, notesTagsQuery.status])

		const writeAccess = useMemo(() => {
			return (
				note.ownerId === stringifiedClient?.userId ||
				note.participants.some(p => p.userId === stringifiedClient?.userId && p.permissionsWrite)
			)
		}, [note.ownerId, note.participants, stringifiedClient?.userId])

		const isOwner = useMemo(() => {
			return note.ownerId === stringifiedClient?.userId
		}, [note.ownerId, stringifiedClient?.userId])

		const onOpenMenu = useCallback(() => {
			useNotesStore.getState().setActive(note)
		}, [note])

		const onCloseMenu = useCallback(() => {
			useNotesStore.getState().setActive(null)
		}, [])

		const buttons = useMemo(() => {
			if (rest.disabled) {
				return []
			}

			const buttons: MenuButton[] = []

			if (origin === "notes" || origin === "search") {
				buttons.push({
					id: isSelected ? "deselect" : "select",
					title: isSelected ? "tbd_deselect" : "tbd_select",
					onPress: () => {
						useNotesStore.getState().setSelected(prev => {
							if (isSelected) {
								return prev.filter(n => n.uuid !== note.uuid)
							} else {
								return [...prev.filter(n => n.uuid !== note.uuid), note]
							}
						})
					}
				})
			}

			if (writeAccess && noteHistory.length > 0) {
				buttons.push({
					id: "history",
					title: "tbd_history",
					subactions: noteHistory.map(historyItem => ({
						id: `history_${historyItem.id}`,
						title: simpleDate(Number(historyItem.editedTimestamp)),
						attributes: {
							keepsMenuPresented: true
						},
						onPress: () => {
							// TODO: Show history item
						}
					}))
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "participants",
					title: "tbd_participants",
					subactions: (
						[
							...note.participants.map(participant => ({
								type: "participant" as const,
								participant
							})),
							{
								type: "add" as const
							}
						] satisfies (
							| {
									type: "add"
							  }
							| {
									type: "participant"
									participant: NoteParticipant
							  }
						)[]
					).map(subaction => {
						if (subaction.type === "add") {
							return {
								id: "addParticipant",
								title: "tbd_addParticipant",
								attributes: {
									keepsMenuPresented: true
								},
								onPress: async () => {
									// TODO: Add participant
								}
							} satisfies MenuButton
						}

						return {
							id: `participant_${subaction.participant.userId}`,
							// TODO : Show name if available
							title: subaction.participant.email ?? subaction.participant.userId,
							attributes: {
								keepsMenuPresented: true
							},
							onPress: () => {
								actionSheet.show()
							}
						} satisfies MenuButton
					})
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "type",
					title: "tbd_type",
					subactions: [
						{
							type: NoteType.Text,
							typeString: "text"
						},
						{
							type: NoteType.Checklist,
							typeString: "checklist"
						},
						{
							type: NoteType.Code,
							typeString: "code"
						},
						{
							type: NoteType.Rich,
							typeString: "rich"
						},
						{
							type: NoteType.Md,
							typeString: "md"
						}
					].map(
						({ type, typeString }) =>
							({
								id: `type_${typeString}`,
								title: `tbd_${typeString}`,
								state: note.noteType === type ? "on" : undefined,
								attributes: {
									keepsMenuPresented: true,
									disabled: note.noteType === type
								},
								onPress: () => {
									runWithLoading(async () => {
										const content = await notes.getContent({
											note
										})

										await notes.setType({
											note,
											type,
											knownContent: content
										})
									})
								}
							}) satisfies MenuButton
					)
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "pinned",
					title: "tbd_pinned",
					state: note.pinned ? "on" : undefined,
					onPress: () => {
						runWithLoading(async () => {
							await notes.setPinned({
								note,
								pinned: !note.pinned
							})
						})
					}
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "favorited",
					title: "tbd_favorited",
					state: note.favorite ? "on" : undefined,
					onPress: () => {
						runWithLoading(async () => {
							await notes.setFavorited({
								note,
								favorite: !note.favorite
							})
						})
					}
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "tags",
					title: "tbd_tags",
					subactions: (
						[
							...notesTags.map(tag => ({
								type: "tag" as const,
								tag
							})),
							{
								type: "create" as const
							}
						] satisfies (
							| {
									type: "create"
							  }
							| {
									type: "tag"
									tag: NoteTag
							  }
						)[]
					).map(subaction => {
						if (subaction.type === "create") {
							return {
								id: "createTag",
								title: "tbd_createTag",
								attributes: {
									keepsMenuPresented: true
								},
								onPress: async () => {
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

									const newName = result.data.value.trim()

									if (newName.length === 0) {
										return
									}

									runWithLoading(async () => {
										await notes.createTag({
											name: newName
										})
									})
								}
							} satisfies MenuButton
						}

						const tagged = note.tags.some(t => t.uuid === subaction.tag.uuid)

						return {
							id: `tag_${subaction.tag.uuid}`,
							title: subaction.tag.name ?? subaction.tag.uuid,
							state: tagged ? "on" : undefined,
							attributes: {
								keepsMenuPresented: true
							},
							onPress: () => {
								runWithLoading(async () => {
									if (tagged) {
										await notes.removeTag({
											note,
											tag: subaction.tag
										})

										return
									}

									await notes.addTag({
										note,
										tag: subaction.tag
									})
								})
							}
						} satisfies MenuButton
					})
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "rename",
					title: "tbd_rename",
					onPress: async () => {
						const result = await run(async () => {
							return await prompts.input({
								title: "tbd_rename_note",
								message: "tbd_enter_new_name",
								defaultValue: note.title,
								cancelText: "tbd_cancel",
								okText: "tbd_rename"
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

						const newTitle = result.data.value.trim()

						if (newTitle.length === 0) {
							return
						}

						runWithLoading(async () => {
							await notes.setTitle({
								note,
								newTitle
							})
						})
					}
				})
			}

			if (writeAccess) {
				buttons.push({
					id: "duplicate",
					title: "tbd_duplicate",
					onPress: () => {
						runWithLoading(async () => {
							await notes.duplicate({
								note
							})
						})
					}
				})
			}

			buttons.push({
				id: "export",
				title: "tbd_export",
				onPress: () => {
					//TODO: Export note
				}
			})

			if (isOwner) {
				if (!note.archive) {
					buttons.push({
						id: "archive",
						title: "tbd_archive",
						onPress: () => {
							runWithLoading(async () => {
								await notes.archive({
									note
								})
							})
						}
					})
				}

				if (note.archive || note.trash) {
					buttons.push({
						id: "restore",
						title: "tbd_restore",
						onPress: () => {
							runWithLoading(async () => {
								await notes.restore({
									note
								})
							})
						}
					})
				}

				if (!note.trash) {
					buttons.push({
						id: "trash",
						title: "tbd_trash",
						attributes: {
							destructive: true
						},
						onPress: async () => {
							const result = await run(async () => {
								return await prompts.alert({
									title: "tbd_trash_note",
									message: "tbd_are_you_sure_trash_note",
									cancelText: "tbd_cancel",
									okText: "tbd_dtrash"
								})
							})

							if (!result.success) {
								console.error(result.error)
								alerts.error(result.error)

								return
							}

							if (result.data.cancelled) {
								return
							}

							runWithLoading(async () => {
								await notes.trash({
									note
								})
							})
						}
					})
				}

				if (note.trash) {
					buttons.push({
						id: "delete",
						title: "tbd_delete",
						attributes: {
							destructive: true
						},
						onPress: async () => {
							const result = await run(async () => {
								return await prompts.alert({
									title: "tbd_delete_note",
									message: "tbd_are_you_sure_delete_note",
									cancelText: "tbd_cancel",
									okText: "tbd_delete"
								})
							})

							if (!result.success) {
								console.error(result.error)
								alerts.error(result.error)

								return
							}

							if (result.data.cancelled) {
								return
							}

							runWithLoading(async () => {
								await notes.delete({
									note
								})
							})
						}
					})
				}
			} else {
				buttons.push({
					id: "leave",
					title: "tbd_leave",
					attributes: {
						destructive: true
					},
					onPress: async () => {}
				})
			}

			return buttons
		}, [origin, writeAccess, rest.disabled, isSelected, note, notesTags, isOwner, noteHistory])

		if (buttons.length === 0 || rest.disabled) {
			return <View className={rest.className}>{children}</View>
		}

		return (
			<MenuComponent
				buttons={buttons}
				onOpenMenu={onOpenMenu}
				onCloseMenu={onCloseMenu}
				{...rest}
			>
				{children}
			</MenuComponent>
		)
	}
)

export default Menu
