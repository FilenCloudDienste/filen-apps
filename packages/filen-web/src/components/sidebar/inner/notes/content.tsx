import { memo, useMemo, Fragment, useState, useCallback, useRef } from "react"
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub
} from "@/components/ui/sidebar"
import useNotesQuery from "@/queries/useNotes.query"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { simpleDate, cn, contactDisplayName } from "@/lib/utils"
import Avatar from "@/components/avatar"
import { useAuth } from "@/hooks/useAuth"
import pathModule from "path"
import { Badge } from "@/components/ui/badge"
import {
	IoTextOutline,
	IoLogoMarkdown,
	IoCodeOutline,
	IoDocumentTextOutline,
	IoCheckboxOutline,
	IoTrashOutline,
	IoArchiveOutline
} from "react-icons/io5"
import {
	PinIcon,
	HeartIcon,
	ChevronRightIcon,
	HashIcon,
	ClockIcon,
	EditIcon,
	PlusIcon,
	DownloadIcon,
	ArchiveIcon,
	TrashIcon,
	LoaderIcon,
	EyeIcon,
	DeleteIcon,
	EllipsisVerticalIcon,
	User2Icon,
	RefreshCcwIcon,
	CopyIcon
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TabsContent } from "@/components/ui/tabs"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import type { NoteTag, Note, NoteType, NoteParticipant } from "@filen/sdk-rs"
import useIdb from "@/hooks/useIdb"
import useNoteUuidFromPathname from "@/hooks/useNoteUuidFromPathname"
import { Virtuoso } from "react-virtuoso"
import Menu, { type MenuItemType } from "@/components/menu"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { useTranslation } from "react-i18next"
import useNotesStore from "@/stores/notes.store"
import { useShallow } from "zustand/shallow"
import useNoteHistoryQuery from "@/queries/useNoteHistory.query"
import TextEditor from "@/components/textEditor"
import Checklist from "@/components/notes/checklist"
import { Button } from "@/components/ui/button"

export type DefaultTags = "favorited" | "pinned" | "archived" | "shared" | "trash"

export const Tree = memo(({ tag, notes }: { tag: NoteTag | DefaultTags; notes: Note[] }) => {
	const noteUuidFromPathname = useNoteUuidFromPathname()

	const openBecauseNoteFromPathOpen = useMemo(() => {
		if (!noteUuidFromPathname) {
			return false
		}

		return notes.some(n => n.uuid === noteUuidFromPathname)
	}, [noteUuidFromPathname, notes])

	const [sidebarNotesOpenTags, setSidebarNotesOpenTags] = useIdb<string[]>("sidebarNotesOpenTags", [])

	const openBecauseSidebarNotesOpenTags = useMemo(() => {
		return sidebarNotesOpenTags.includes(typeof tag === "string" ? tag : tag.uuid)
	}, [sidebarNotesOpenTags, tag])

	const [open, setOpen] = useState<boolean>(openBecauseNoteFromPathOpen || openBecauseSidebarNotesOpenTags)
	const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
	const [draggingOver, setDraggingOver] = useState<boolean>(false)
	const { t } = useTranslation()
	const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
	const navigate = useNavigate()

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			setSidebarNotesOpenTags(prev =>
				isOpen
					? [...prev.filter(t => t !== (typeof tag === "string" ? tag : tag.uuid)), typeof tag === "string" ? tag : tag.uuid]
					: prev.filter(t => t !== (typeof tag === "string" ? tag : tag.uuid))
			)
			setOpen(isOpen)
		},
		[setSidebarNotesOpenTags, tag]
	)

	const openContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (!contextMenuTriggerRef.current) {
			return
		}

		contextMenuTriggerRef.current.dispatchEvent(
			new MouseEvent("contextmenu", {
				bubbles: true,
				cancelable: true,
				clientX: e.clientX,
				clientY: e.clientY,
				screenX: e.screenX,
				screenY: e.screenY
			})
		)
	}, [])

	const onDragOver = useCallback(
		(e: React.DragEvent) => {
			if (typeof tag === "string" && tag === "shared") {
				return
			}

			const draggingNotes = useNotesStore.getState().draggingNotes

			if (
				draggingNotes.length === 0 ||
				draggingNotes.some(n => n.tags.map(t => t.uuid).includes(typeof tag === "string" ? tag : tag.uuid))
			) {
				return
			}

			e.preventDefault()

			setDraggingOver(true)
		},
		[tag]
	)

	const onDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()

		setDraggingOver(false)
	}, [])

	const onDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault()

			try {
				if (typeof tag === "string" && tag === "shared") {
					return
				}

				setDraggingOver(false)

				const draggingNotes = useNotesStore.getState().draggingNotes

				if (
					draggingNotes.length === 0 ||
					draggingNotes.some(n => n.tags.map(t => t.uuid).includes(typeof tag === "string" ? tag : tag.uuid))
				) {
					return
				}

				const toast = toasts.loading()

				try {
					if (typeof tag === "string") {
						switch (tag) {
							case "archived": {
								await Promise.all(draggingNotes.map(n => libNotes.archive(n)))

								return
							}

							case "favorited": {
								await Promise.all(draggingNotes.map(n => libNotes.favorite(n, true)))

								return
							}

							case "pinned": {
								await Promise.all(draggingNotes.map(n => libNotes.pin(n, true)))

								return
							}

							case "trash": {
								await Promise.all(draggingNotes.map(n => libNotes.trash(n)))

								return
							}

							default: {
								return
							}
						}
					}

					await Promise.all(
						draggingNotes.map(async n => {
							await Promise.all(
								n.tags.map(async t => {
									n = await libNotes.removeTag(n, t)
								})
							)

							await libNotes.tag(n, tag)
						})
					)
				} catch (e) {
					console.error(e)
					toast.error(e)
				} finally {
					toast.dismiss()

					useNotesStore.getState().setDraggingNotes([])
				}
			} finally {
				useNotesStore.getState().setDraggingNotes([])
			}
		},
		[tag]
	)

	const menuItems = useMemo(() => {
		if (typeof tag === "string") {
			return []
		}

		return [
			{
				type: "submenu",
				trigger: t("notes.menu.createNote"),
				triggerInset: true,
				content: [
					{
						type: "label",
						text: t("notes.menu.createNote")
					},
					{
						type: "separator"
					},
					...(
						[
							{
								type: "text",
								text: t("notes.menu.typeText"),
								icon: <IoTextOutline color="#3b82f6" />
							},
							{
								type: "rich",
								text: t("notes.menu.typeRichtext"),
								icon: <IoDocumentTextOutline color="#06b6d4" />
							},
							{
								type: "checklist",
								text: t("notes.menu.typeChecklist"),
								icon: <IoCheckboxOutline color="#a855f7" />
							},
							{
								type: "md",
								text: t("notes.menu.typeMarkdown"),
								icon: <IoLogoMarkdown color="#6366f1" />
							},
							{
								type: "code",
								text: t("notes.menu.typeCode"),
								icon: <IoCodeOutline color="#ef4444" />
							}
						] as {
							type: NoteType
							text: string
							icon: React.ReactNode
						}[]
					).map(
						type =>
							({
								type: "item",
								onClick: async () => {
									try {
										const note = await libNotes.create(type.type)

										await libNotes.tag(note, tag)

										navigate({
											to: "/notes/$",
											params: {
												_splat: note.uuid
											}
										})
									} catch (e) {
										console.error(e)
										toasts.error(e)
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{type.text}
										{type.icon}
									</div>
								)
							}) satisfies MenuItemType
					)
				]
			},
			{
				type: "checkbox",
				checked: tag.favorite,
				onCheckedChange: async checked => {
					const toast = toasts.loading()

					try {
						await libNotes.tags.favorite(tag, checked)
					} catch (e) {
						console.error(e)
						toast.error(e)
					} finally {
						toast.dismiss()
					}
				},
				text: (
					<div className="flex flex-row items-center gap-8 w-full justify-between">
						{t("notes.menu.favorited")}
						<HeartIcon className="size-[14px]" />
					</div>
				)
			},
			{
				type: "item",
				inset: true,
				onClick: async () => {
					try {
						await libNotes.tags.rename(tag)
					} catch (e) {
						console.error(e)
						toasts.error(e)
					}
				},
				text: (
					<div className="flex flex-row items-center gap-8 w-full justify-between">
						{t("notes.menu.rename")}
						<EditIcon className="size-[14px]" />
					</div>
				)
			},
			{
				type: "item",
				inset: true,
				onClick: async () => {
					const toast = toasts.loading()

					try {
						await libNotes.tags.delete(tag)
					} catch (e) {
						console.error(e)
						toast.error(e)
					} finally {
						toast.dismiss()
					}
				},
				text: (
					<div className="flex flex-row items-center gap-8 w-full justify-between">
						{t("notes.menu.delete")}
						<DeleteIcon className="size-[14px] text-destructive" />
					</div>
				),
				destructive: true
			}
		] satisfies MenuItemType[]
	}, [tag, t, navigate])

	return (
		<Menu
			type="context"
			onOpenChange={setContextMenuOpen}
			triggerAsChild={true}
			items={menuItems}
		>
			<SidebarMenuItem className="px-2 py-0.5">
				<Collapsible
					className="group/collapsible"
					style={{
						width: "calc(var(--sidebar-width) - var(--sidebar-width-icon) - 32px)"
					}}
					open={open}
					onOpenChange={onOpenChange}
				>
					<CollapsibleTrigger asChild={true}>
						<div ref={contextMenuTriggerRef}>
							<SidebarMenuButton
								className={cn(
									"cursor-pointer flex flex-1 flex-row items-center justify-between gap-2 w-full overflow-hidden pr-0",
									(contextMenuOpen || draggingOver) && "bg-muted",
									draggingOver ? "border-1 border-blue-500" : "border-1 border-transparent"
								)}
								onDragOver={onDragOver}
								onDragLeave={onDragLeave}
								onDrop={onDrop}
							>
								<div className="flex flex-row items-center gap-2 overflow-hidden">
									<ChevronRightIcon
										className={cn("transition-transform cursor-pointer shrink-0 size-4", open && "rotate-90")}
										onClick={e => {
											e.preventDefault()
											e.stopPropagation()

											onOpenChange(!open)
										}}
									/>
									{typeof tag === "string" ? (
										<Fragment>
											{tag === "archived" && <ArchiveIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "favorited" && <HeartIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "pinned" && <PinIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "trash" && <TrashIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "shared" && <User2Icon className="text-muted-foreground size-4 shrink-0" />}
										</Fragment>
									) : (
										<HashIcon className="text-muted-foreground size-4 shrink-0" />
									)}
									{typeof tag !== "string" && tag.favorite && <HeartIcon className="size-4 text-destructive shrink-0" />}
									<p className="truncate">
										{typeof tag === "string"
											? tag === "archived"
												? t("notes.defaultTags.archived")
												: tag === "favorited"
													? t("notes.defaultTags.favorited")
													: tag === "pinned"
														? t("notes.defaultTags.pinned")
														: tag === "trash"
															? t("notes.defaultTags.trash")
															: tag === "shared"
																? t("notes.defaultTags.shared")
																: tag
											: (tag.name ?? tag.uuid)}
									</p>
								</div>
								{typeof tag !== "string" && (
									<Tooltip delayDuration={1000}>
										<TooltipTrigger asChild={true}>
											<div
												className="h-[inherit] w-auto p-0 shrink-0 flex items-center justify-center rounded-full px-2"
												onClick={openContextMenu}
											>
												<EllipsisVerticalIcon className="size-4 shrink-0" />
											</div>
										</TooltipTrigger>
										<TooltipContent className="select-none">tbd</TooltipContent>
									</Tooltip>
								)}
							</SidebarMenuButton>
						</div>
					</CollapsibleTrigger>
					<CollapsibleContent>
						{open && notes.length > 0 && (
							<SidebarMenuSub className="pl-4 w-full">
								{notes.map(note => (
									<NoteComp
										key={note.uuid}
										note={note}
										fromTree={true}
									/>
								))}
							</SidebarMenuSub>
						)}
					</CollapsibleContent>
				</Collapsible>
			</SidebarMenuItem>
		</Menu>
	)
})

Tree.displayName = "Tree"

export const NoteMenu = memo(
	({
		note,
		children,
		onOpenChange,
		type
	}: {
		note: Note
		children: React.ReactNode
		onOpenChange?: (open: boolean) => void
		type: React.ComponentPropsWithRef<typeof Menu>["type"]
	}) => {
		const navigate = useNavigate()
		const { t } = useTranslation()
		const { client } = useAuth()
		const [open, setOpen] = useState<boolean>(false)
		const [settingParticipantPermissions, setSettingParticipantPermissions] = useState<NoteParticipant | null>()

		const noteHistoryQuery = useNoteHistoryQuery(
			{
				uuid: note.uuid
			},
			{
				enabled: open
			}
		)

		const notesTagsQuery = useNotesTagsQuery({
			enabled: false
		})

		const notesTags = useMemo(() => {
			if (notesTagsQuery.status !== "success") {
				return []
			}

			return notesTagsQuery.data.sort((a, b) =>
				(a.name ?? a.uuid).localeCompare(b.name ?? b.uuid, "en", {
					numeric: true
				})
			)
		}, [notesTagsQuery.data, notesTagsQuery.status])

		const noteHistory = useMemo(() => {
			if (noteHistoryQuery.status !== "success") {
				return []
			}

			return noteHistoryQuery.data.sort((a, b) => Number(b.editedTimestamp) - Number(a.editedTimestamp))
		}, [noteHistoryQuery.data, noteHistoryQuery.status])

		const noteParticipants = useMemo(() => {
			return note.participants.filter(participant => participant.userId !== client?.userId)
		}, [note.participants, client])

		const isOwner = useMemo(() => {
			return note.ownerId === client?.userId
		}, [note.ownerId, client])

		const items = useMemo(() => {
			return [
				...(noteHistoryQuery.status === "success"
					? [
							{
								type: "submenu",
								trigger: t("notes.menu.history"),
								triggerInset: true,
								content: [
									{
										type: "label",
										text: t("notes.menu.history")
									},
									{
										type: "separator"
									},
									...noteHistory.map(
										history =>
											({
												type: "submenu",
												trigger: simpleDate(Number(history.editedTimestamp)),
												contentClassName: "p-0",
												content: (
													<div className="flex flex-1 flex-col h-[50dvh] w-[50dvh]">
														<div className="flex flex-1 flex-row overflow-x-hidden overflow-y-auto h-full w-full select-text">
															{history.noteType === "checklist" && (
																<Checklist
																	editable={false}
																	initialValue={history.content ?? ""}
																/>
															)}
															{(history.noteType === "text" ||
																history.noteType === "md" ||
																history.noteType === "code" ||
																history.noteType === "rich") && (
																<TextEditor
																	editable={false}
																	initialValue={history.content ?? ""}
																/>
															)}
														</div>
														<div className="flex flex-row items-center justify-between gap-4 p-2 border-t border-border">
															<p className="truncate text-sm text-muted-foreground">
																{simpleDate(Number(history.editedTimestamp))}
															</p>
															<Button
																variant="default"
																size="sm"
																onClick={async () => {
																	try {
																		await libNotes.restoreHistory(note, history)
																	} catch (e) {
																		console.error(e)
																		toasts.error(e)
																	}
																}}
															>
																tbd
															</Button>
														</div>
													</div>
												)
											}) satisfies MenuItemType
									)
								]
							} satisfies MenuItemType
						]
					: [
							{
								type: "item",
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										<p>{t("notes.menu.history")}</p>
										{noteHistory.length === 0 ? (
											<ClockIcon className="size-[14px] shrink-0" />
										) : (
											<LoaderIcon className="size-[14px] animate-spin shrink-0" />
										)}
									</div>
								),
								inset: true
							} satisfies MenuItemType
						]),
				...(isOwner || noteParticipants.length > 0
					? [
							{
								type: "submenu",
								trigger: t("notes.menu.participants"),
								triggerInset: true,
								content: [
									...(noteParticipants.length > 0
										? [
												{
													type: "label",
													text: t("notes.menu.participants")
												} satisfies MenuItemType
											]
										: []),
									...(noteParticipants.length > 0
										? [
												{
													type: "separator"
												} satisfies MenuItemType
											]
										: []),
									...noteParticipants.map(
										participant =>
											({
												type: "item",
												className: "cursor-default hover:bg-transparent focus:bg-transparent active:bg-transparent",
												text: (
													<div className="flex flex-row items-center gap-8 overflow-hidden justify-between w-full">
														<div className="flex flex-row items-center gap-2 flex-1 overflow-hidden max-w-[25dvw]">
															<Avatar
																name={contactDisplayName(participant)}
																src={participant.avatar}
																width={20}
																height={20}
															/>
															<p className="truncate">{contactDisplayName(participant)}</p>
														</div>
														{isOwner && (
															<div className="flex flex-row items-center gap-2">
																<Badge
																	className="shrink-0 cursor-pointer"
																	onClick={async e => {
																		e.preventDefault()
																		e.stopPropagation()

																		if (settingParticipantPermissions?.userId === participant.userId) {
																			return
																		}

																		setSettingParticipantPermissions(participant)

																		try {
																			await libNotes.setParticipantsPermissions(note, [
																				{
																					participant,
																					permissionsWrite: !participant.permissionsWrite
																				}
																			])
																		} catch (e) {
																			console.error(e)
																			toasts.error(e)
																		} finally {
																			setSettingParticipantPermissions(null)
																		}
																	}}
																>
																	<Tooltip>
																		<TooltipTrigger asChild={true}>
																			<div>
																				{settingParticipantPermissions?.userId ===
																				participant.userId ? (
																					<LoaderIcon className="size-[14px] animate-spin shrink-0" />
																				) : (
																					<Fragment>
																						{participant.permissionsWrite ? (
																							<EyeIcon className="size-[14px] cursor-pointer shrink-0" />
																						) : (
																							<EditIcon className="size-[14px] cursor-pointer shrink-0" />
																						)}
																					</Fragment>
																				)}
																			</div>
																		</TooltipTrigger>
																		<TooltipContent>
																			{participant.permissionsWrite ? "tdb" : "tdb"}
																		</TooltipContent>
																	</Tooltip>
																</Badge>
																<Badge
																	className="shrink-0 cursor-pointer"
																	variant="destructive"
																	onClick={async e => {
																		e.preventDefault()
																		e.stopPropagation()

																		try {
																			await libNotes.removeParticipants(note, [participant])
																		} catch (e) {
																			console.error(e)
																			toasts.error(e)
																		}
																	}}
																>
																	<Tooltip>
																		<TooltipTrigger asChild={true}>
																			<div>
																				<DeleteIcon className="size-[14px] cursor-pointer" />
																			</div>
																		</TooltipTrigger>
																		<TooltipContent>tdb</TooltipContent>
																	</Tooltip>
																</Badge>
															</div>
														)}
													</div>
												)
											}) satisfies MenuItemType
									),
									...(noteParticipants.length > 0
										? [
												{
													type: "separator"
												} satisfies MenuItemType
											]
										: []),
									...(isOwner
										? [
												{
													type: "item",
													onClick: async e => {
														e.preventDefault()
														e.stopPropagation()

														try {
															await libNotes.addParticipants(note)
														} catch (e) {
															console.error(e)
															toasts.error(e)
														}
													},
													text: (
														<div className="flex flex-row items-center gap-2 w-full">
															<PlusIcon className="size-[14px] shrink-0" />
															<p className="shrink-0">{t("notes.menu.addParticipants")}</p>
														</div>
													)
												} satisfies MenuItemType
											]
										: [])
								]
							} satisfies MenuItemType
						]
					: []),
				{
					type: "submenu",
					trigger: t("notes.menu.type"),
					triggerInset: true,
					content: [
						{
							type: "label",
							text: t("notes.menu.type")
						},
						{
							type: "separator"
						},
						...(
							[
								{
									type: "text",
									text: t("notes.menu.typeText"),
									icon: <IoTextOutline color="#3b82f6" />
								},
								{
									type: "rich",
									text: t("notes.menu.typeRichtext"),
									icon: <IoDocumentTextOutline color="#06b6d4" />
								},
								{
									type: "checklist",
									text: t("notes.menu.typeChecklist"),
									icon: <IoCheckboxOutline color="#a855f7" />
								},
								{
									type: "md",
									text: t("notes.menu.typeMarkdown"),
									icon: <IoLogoMarkdown color="#6366f1" />
								},
								{
									type: "code",
									text: t("notes.menu.typeCode"),
									icon: <IoCodeOutline color="#ef4444" />
								}
							] as {
								type: NoteType
								text: string
								icon: React.ReactNode
							}[]
						).map(
							type =>
								({
									type: "checkbox",
									checked: note.noteType === type.type,
									onCheckedChange: async () => {
										const toast = toasts.loading()

										try {
											await libNotes.setType(note, type.type)
										} catch (e) {
											console.error(e)
											toast.error(e)
										} finally {
											toast.dismiss()
										}
									},
									text: (
										<div className="flex flex-row items-center gap-8 w-full justify-between">
											{type.text}
											{type.icon}
										</div>
									)
								}) satisfies MenuItemType
						)
					]
				},
				{
					type: "checkbox",
					checked: note.pinned,
					onCheckedChange: async checked => {
						const toast = toasts.loading()

						try {
							await libNotes.pin(note, checked)
						} catch (e) {
							console.error(e)
							toast.error(e)
						} finally {
							toast.dismiss()
						}
					},
					text: (
						<div className="flex flex-row items-center gap-8 w-full justify-between">
							{t("notes.menu.pinned")}
							<PinIcon className="size-[14px]" />
						</div>
					)
				},
				{
					type: "checkbox",
					checked: note.favorite,
					onCheckedChange: async checked => {
						const toast = toasts.loading()

						try {
							await libNotes.favorite(note, checked)
						} catch (e) {
							console.error(e)
							toast.error(e)
						} finally {
							toast.dismiss()
						}
					},
					text: (
						<div className="flex flex-row items-center gap-8 w-full justify-between">
							{t("notes.menu.favorited")}
							<HeartIcon className="size-[14px]" />
						</div>
					)
				},
				{
					type: "submenu",
					trigger: t("notes.menu.tags"),
					triggerInset: true,
					content: [
						{
							type: "label",
							text: t("notes.menu.tags")
						},
						{
							type: "separator"
						},
						...notesTags.map(
							tag =>
								({
									type: "checkbox",
									checked: note.tags.some(t => t.uuid === tag.uuid),
									onCheckedChange: async () => {
										const toast = toasts.loading()

										try {
											await libNotes.tag(note, tag)
										} catch (e) {
											console.error(e)
											toast.error(e)
										} finally {
											toast.dismiss()
										}
									},
									text: (
										<div className="flex flex-row items-center gap-8 w-full justify-between">
											{tag.name ?? tag.uuid}
											<HashIcon className="text-muted-foreground size-[14px]" />
										</div>
									)
								}) satisfies MenuItemType
						)
					]
				},
				...(isOwner
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									try {
										await libNotes.rename(note)
									} catch (e) {
										console.error(e)
										toasts.error(e)
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.rename")}
										<EditIcon className="size-[14px]" />
									</div>
								)
							} satisfies MenuItemType
						]
					: []),
				{
					type: "item",
					inset: true,
					onClick: async () => {
						const toast = toasts.loading()

						try {
							const duplicate = await libNotes.duplicate(note)

							navigate({
								to: "/notes",
								params: {
									_splat: duplicate.uuid
								}
							})
						} catch (e) {
							console.error(e)
							toast.error(e)
						} finally {
							toast.dismiss()
						}
					},
					text: (
						<div className="flex flex-row items-center gap-8 w-full justify-between">
							{t("notes.menu.duplicate")}
							<CopyIcon className="size-[14px]" />
						</div>
					)
				},
				{
					type: "submenu",
					trigger: t("notes.menu.export"),
					triggerInset: true,
					content: [
						{
							type: "label",
							text: t("notes.menu.export")
						},
						{
							type: "separator"
						},
						{
							type: "item",
							onClick: async () => {
								const toast = toasts.loading()

								try {
									await libNotes.export(note)
								} catch (e) {
									console.error(e)
									toast.error(e)
								} finally {
									toast.dismiss()
								}
							},
							text: (
								<div className="flex flex-row items-center gap-8 w-full justify-between">
									{t("notes.menu.export")}
									<DownloadIcon className="size-[14px]" />
								</div>
							)
						},
						{
							type: "item",
							onClick: async () => {
								const toast = toasts.loading()

								try {
									await libNotes.exportAll()
								} catch (e) {
									console.error(e)
									toast.error(e)
								} finally {
									toast.dismiss()
								}
							},
							text: (
								<div className="flex flex-row items-center gap-8 w-full justify-between">
									{t("notes.menu.exportAll")}
									<DownloadIcon className="size-[14px]" />
								</div>
							)
						}
					]
				},
				...(isOwner && !note.trash && !note.archive
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									const toast = toasts.loading()

									try {
										await libNotes.archive(note)
									} catch (e) {
										console.error(e)
										toast.error(e)
									} finally {
										toast.dismiss()
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.archive")}
										<ArchiveIcon className="size-[14px]" />
									</div>
								)
							} satisfies MenuItemType
						]
					: []),
				...(isOwner && !note.archive && !note.trash
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									const toast = toasts.loading()

									try {
										await libNotes.trash(note)

										navigate({
											to: "/notes"
										})
									} catch (e) {
										console.error(e)
										toast.error(e)
									} finally {
										toast.dismiss()
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.trash")}
										<TrashIcon className="size-[14px] text-destructive" />
									</div>
								),
								destructive: true
							} satisfies MenuItemType
						]
					: []),
				...(isOwner && (note.trash || note.archive)
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									const toast = toasts.loading()

									try {
										await libNotes.restore(note)
									} catch (e) {
										console.error(e)
										toast.error(e)
									} finally {
										toast.dismiss()
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.restore")}
										<RefreshCcwIcon className="size-[14px]" />
									</div>
								)
							} satisfies MenuItemType
						]
					: []),
				...(isOwner && !note.archive && note.trash
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									try {
										await libNotes.delete(note)
									} catch (e) {
										console.error(e)
										toasts.error(e)
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.delete")}
										<DeleteIcon className="size-[14px] text-destructive" />
									</div>
								),
								destructive: true
							} satisfies MenuItemType
						]
					: []),
				...(!isOwner && client
					? [
							{
								type: "item",
								inset: true,
								onClick: async () => {
									const toast = toasts.loading()

									try {
										await libNotes.leave(note, client.userId)

										navigate({
											to: "/notes"
										})
									} catch (e) {
										console.error(e)
										toast.error(e)
									} finally {
										toast.dismiss()
									}
								},
								text: (
									<div className="flex flex-row items-center gap-8 w-full justify-between">
										{t("notes.menu.leave")}
										<DeleteIcon className="size-[14px] text-destructive" />
									</div>
								),
								destructive: true
							} satisfies MenuItemType
						]
					: [])
			] satisfies MenuItemType[]
		}, [
			note,
			notesTags,
			navigate,
			t,
			noteParticipants,
			isOwner,
			client,
			noteHistory,
			noteHistoryQuery.status,
			settingParticipantPermissions
		])

		const onChangeOpen = useCallback(
			(isOpen: boolean) => {
				setOpen(isOpen)
				onOpenChange?.(isOpen)
			},
			[onOpenChange]
		)

		return (
			<Menu
				onOpenChange={onChangeOpen}
				triggerAsChild={true}
				type={type}
				items={items}
			>
				{children}
			</Menu>
		)
	}
)

NoteMenu.displayName = "NoteMenu"

export const NoteComp = memo(({ note, fromTree }: { note: Note; fromTree?: boolean }) => {
	const { client } = useAuth()
	const { pathname } = useLocation()
	const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
	const syncing = useNotesStore(useShallow(state => state.syncing))

	const activeLink = useMemo(() => {
		return pathModule.posix.basename(pathname)
	}, [pathname])

	const onDragStart = useCallback(() => {
		useNotesStore.getState().setDraggingNotes([...useNotesStore.getState().draggingNotes.filter(n => n.uuid !== note.uuid), note])
	}, [note])

	return (
		<NoteMenu
			note={note}
			onOpenChange={setContextMenuOpen}
			type="context"
		>
			<SidebarMenuItem key={note.uuid}>
				<Link
					to="/notes/$"
					params={{
						_splat: note.uuid
					}}
				>
					<SidebarMenuButton
						isActive={activeLink === note.uuid || contextMenuOpen}
						className={cn(
							"cursor-pointer flex flex-1 flex-col px-4 h-auto items-start data-[active=true]:font-normal",
							!fromTree && "rounded-none",
							activeLink === note.uuid ? "border-l-2 border-blue-500" : "border-l-2 border-transparent"
						)}
						draggable={true}
						onDragStart={onDragStart}
					>
						<div className="flex flex-1 flex-row gap-4 overflow-hidden w-full">
							<div className="flex flex-col gap-2">
								{note.archive ? (
									<IoArchiveOutline
										className="size-5 shrink-0"
										color="#eab308"
									/>
								) : note.trash ? (
									<IoTrashOutline
										className="size-5 shrink-0"
										color="#ef4444"
									/>
								) : (
									<div className="flex flex-col gap-2">
										<Tooltip delayDuration={1000}>
											<TooltipTrigger asChild={true}>
												<div>
													{note.noteType === "text" && (
														<IoTextOutline
															className="size-5 shrink-0"
															color="#3b82f6"
														/>
													)}
													{note.noteType === "md" && (
														<IoLogoMarkdown
															className="size-5 shrink-0"
															color="#6366f1"
														/>
													)}
													{note.noteType === "code" && (
														<IoCodeOutline
															className="size-5 shrink-0"
															color="#ef4444"
														/>
													)}
													{note.noteType === "rich" && (
														<IoDocumentTextOutline
															className="size-5 shrink-0"
															color="#06b6d4"
														/>
													)}
													{note.noteType === "checklist" && (
														<IoCheckboxOutline
															className="size-5 shrink-0"
															color="#a855f7"
														/>
													)}
												</div>
											</TooltipTrigger>
											<TooltipContent>tbd</TooltipContent>
										</Tooltip>
										<div>
											{note.pinned && (
												<Tooltip delayDuration={1000}>
													<TooltipTrigger asChild={true}>
														<PinIcon className="size-5 text-muted-foreground shrink-0" />
													</TooltipTrigger>
													<TooltipContent>tbd</TooltipContent>
												</Tooltip>
											)}
										</div>
									</div>
								)}
							</div>
							<div className="flex flex-1 flex-col gap-2 overflow-hidden">
								<div className="flex flex-1 flex-row items-center gap-2 overflow-hidden">
									{syncing && syncing.uuid === note.uuid && <LoaderIcon className="animate-spin size-4 shrink-0" />}
									{note.favorite && (
										<Tooltip delayDuration={1000}>
											<TooltipTrigger asChild={true}>
												<HeartIcon className="size-4 shrink-0 text-destructive" />
											</TooltipTrigger>
											<TooltipContent>tbd</TooltipContent>
										</Tooltip>
									)}
									<p className="text-md font-semibold truncate text-ellipsis">
										{note.title && note.title.length > 0 ? note.title : simpleDate(Number(note.createdTimestamp))}
									</p>
								</div>
								{note.preview && note.preview.length > 0 && <p className="line-clamp-2 text-ellipsis">{note.preview}</p>}
								<p className="text-xs text-muted-foreground truncate text-ellipsis">
									{simpleDate(Number(note.editedTimestamp))}
								</p>
								{note.participants.filter(participant => participant.userId !== client?.userId).length > 0 && (
									<div className="flex flex-row items-center gap-2 flex-wrap">
										{note.participants
											.filter(participant => participant.userId !== client?.userId)
											.map(participant => (
												<Avatar
													key={participant.userId}
													name={participant.email}
													src={participant.avatar}
													width={22}
													height={22}
												/>
											))}
									</div>
								)}
								{note.tags.length > 0 && (
									<div className="flex flex-row flex-wrap items-center gap-2">
										{note.tags.map(tag => (
											<Badge
												key={tag.uuid}
												variant="outline"
												className="hover:bg-sidebar-foreground hover:text-white dark:hover:text-black cursor-pointer"
											>
												<p className="text-xs">{tag.name}</p>
											</Badge>
										))}
									</div>
								)}
							</div>
						</div>
					</SidebarMenuButton>
				</Link>
			</SidebarMenuItem>
		</NoteMenu>
	)
})

NoteComp.displayName = "NoteComp"

export const InnerSidebarNotesContent = memo(() => {
	const notesQuery = useNotesQuery()
	const notesTagsQuery = useNotesTagsQuery()

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		return notesQuery.data.sort((a, b) => {
			if (a.pinned !== b.pinned) {
				return b.pinned ? 1 : -1
			}

			if (a.trash !== b.trash && a.archive === false) {
				return a.trash ? 1 : -1
			}

			if (a.archive !== b.archive) {
				return a.archive ? 1 : -1
			}

			if (a.trash !== b.trash) {
				return a.trash ? 1 : -1
			}

			return Number(b.editedTimestamp) - Number(a.editedTimestamp)
		})
	}, [notesQuery.data, notesQuery.status])

	const treeItemsForTag = useCallback(
		(tag: NoteTag | DefaultTags) => {
			if (typeof tag === "string") {
				switch (tag) {
					case "favorited": {
						return notes.filter(note => note.favorite)
					}

					case "pinned": {
						return notes.filter(note => note.pinned)
					}

					case "archived": {
						return notes.filter(note => note.archive && !note.trash)
					}

					case "shared": {
						return notes.filter(note => note.participants.length > 1)
					}

					case "trash": {
						return notes.filter(note => note.trash && !note.archive)
					}

					default: {
						return []
					}
				}
			}

			return notes.filter(note => note.tags.some(t => t.uuid === tag.uuid))
		},
		[notes]
	)

	const notesTags = useMemo(() => {
		if (notesTagsQuery.status !== "success") {
			return []
		}

		return (
			[
				"favorited",
				"pinned",
				"shared",
				...notesTagsQuery.data.sort((a, b) =>
					(a.name ?? a.uuid).localeCompare(b.name ?? b.uuid, "en", {
						numeric: true
					})
				),
				"archived",
				"trash"
			] satisfies (NoteTag | DefaultTags)[]
		).filter(tag => (typeof tag === "string" ? treeItemsForTag(tag).length > 0 : true))
	}, [notesTagsQuery.data, notesTagsQuery.status, treeItemsForTag])

	const computeItemKeyNotes = useCallback((_: number, note: Note) => note.uuid, [])

	const computeItemKeyNotesTags = useCallback((_: number, tag: NoteTag | DefaultTags) => (typeof tag === "string" ? tag : tag.uuid), [])

	const itemContentNotes = useCallback((_: number, note: Note) => {
		return <NoteComp note={note} />
	}, [])

	const itemContentNotesTags = useCallback(
		(_: number, tag: NoteTag | DefaultTags) => {
			return (
				<Tree
					tag={tag}
					notes={treeItemsForTag(tag)}
				/>
			)
		},
		[treeItemsForTag]
	)

	return (
		<Fragment>
			<TabsContent
				value="all"
				className="flex flex-1 flex-col overflow-hidden w-full h-full pb-36"
			>
				<SidebarContent className="px-0 w-full h-full">
					<SidebarGroup className="overflow-x-hidden shrink-0 px-0 w-full h-full">
						<SidebarGroupContent className="w-full h-full">
							<SidebarMenu className="gap-0 w-full h-full">
								<Virtuoso
									className="flex-1 h-full w-full overflow-x-hidden overflow-y-scroll"
									data={notes}
									computeItemKey={computeItemKeyNotes}
									totalCount={notes.length}
									itemContent={itemContentNotes}
								/>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</TabsContent>
			<TabsContent
				value="tags"
				className="flex flex-1 flex-col overflow-hidden w-full h-full pb-36"
			>
				<SidebarContent className="px-0 w-full h-full">
					<SidebarGroup className="overflow-x-hidden shrink-0 px-0 w-full h-full">
						<SidebarGroupContent className="w-full h-full">
							<SidebarMenu className="gap-0 w-full h-full">
								<Virtuoso
									className="flex-1 h-full w-full overflow-x-hidden overflow-y-scroll"
									data={notesTags}
									computeItemKey={computeItemKeyNotesTags}
									totalCount={notesTags.length}
									itemContent={itemContentNotesTags}
									overscan={window.innerHeight / 2}
									increaseViewportBy={window.innerHeight / 2}
								/>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</TabsContent>
		</Fragment>
	)
})

InnerSidebarNotesContent.displayName = "InnerSidebarNotesContent"

export default InnerSidebarNotesContent
