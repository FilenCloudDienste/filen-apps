import type { MenuItemType } from "@/components/menu"
import type { Note, NoteType } from "@filen/sdk-rs"
import useNoteHistoryQuery from "@/queries/useNoteHistory.query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { simpleDate } from "@/lib/utils"
import { HistoryItem } from "./history"
import { useAuth } from "@/hooks/useAuth"
import { Participant } from "./participants"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import Icon from "@/components/notes/icon"
import {
	PinIcon,
	HeartIcon,
	HashIcon,
	EditIcon,
	CopyIcon,
	DownloadIcon,
	ArchiveIcon,
	TrashIcon,
	RefreshCcwIcon,
	DeleteIcon,
	PlusIcon,
	LoaderIcon
} from "lucide-react"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { useNavigate } from "@tanstack/react-router"

export function useMenuItems({ note, menuOpen }: { note: Note; menuOpen: boolean }): MenuItemType[] {
	const { t } = useTranslation()
	const { client } = useAuth()
	const navigate = useNavigate()

	const noteHistoryQuery = useNoteHistoryQuery(
		{
			uuid: note.uuid
		},
		{
			enabled: menuOpen
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

	const history = useMemo((): MenuItemType | null => {
		if (noteHistoryQuery.status !== "success") {
			return {
				type: "item",
				text: (
					<div className="flex flex-row items-center gap-8 w-full justify-between">
						<p>{t("notes.menu.history")}</p>
						<LoaderIcon className="size-[14px] animate-spin shrink-0" />
					</div>
				),
				inset: true
			} satisfies MenuItemType
		}

		if (noteHistory.length === 0) {
			return null
		}

		return {
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
								<HistoryItem
									note={note}
									history={history}
								/>
							)
						}) satisfies MenuItemType
				)
			]
		} satisfies MenuItemType
	}, [noteHistory, note, noteHistoryQuery.status, t])

	const participants = useMemo((): MenuItemType => {
		return {
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
								<Participant
									note={note}
									participant={participant}
									isOwner={isOwner}
								/>
							)
						}) satisfies MenuItemType
				),
				...(noteParticipants.length > 0 && isOwner
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
	}, [noteParticipants, isOwner, note, t])

	const type = useMemo((): MenuItemType => {
		return {
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
							icon: (
								<Icon
									type="text"
									className="size-[14px]"
								/>
							)
						},
						{
							type: "rich",
							text: t("notes.menu.typeRichtext"),
							icon: (
								<Icon
									type="rich"
									className="size-[14px]"
								/>
							)
						},
						{
							type: "checklist",
							text: t("notes.menu.typeChecklist"),
							icon: (
								<Icon
									type="checklist"
									className="size-[14px]"
								/>
							)
						},
						{
							type: "md",
							text: t("notes.menu.typeMarkdown"),
							icon: (
								<Icon
									type="md"
									className="size-[14px]"
								/>
							)
						},
						{
							type: "code",
							text: t("notes.menu.typeCode"),
							icon: (
								<Icon
									type="code"
									className="size-[14px]"
								/>
							)
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
							onCheckedChange: async (checked: boolean) => {
								if (!checked) {
									return
								}

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
		} satisfies MenuItemType
	}, [t, note])

	const pinned = useMemo((): MenuItemType => {
		return {
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
		} satisfies MenuItemType
	}, [t, note])

	const favorited = useMemo((): MenuItemType => {
		return {
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
		} satisfies MenuItemType
	}, [t, note])

	const tags = useMemo((): MenuItemType => {
		return {
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
		} satisfies MenuItemType
	}, [t, note, notesTags])

	const rename = useMemo((): MenuItemType | null => {
		if (!isOwner) {
			return null
		}

		return {
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
	}, [t, note, isOwner])

	const duplicate = useMemo((): MenuItemType => {
		return {
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
		} satisfies MenuItemType
	}, [t, note, navigate])

	const exportMenu = useMemo((): MenuItemType => {
		return {
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
		} satisfies MenuItemType
	}, [t, note])

	const archive = useMemo((): MenuItemType | null => {
		if (!isOwner || note.trash || note.archive) {
			return null
		}

		return {
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
	}, [t, note, isOwner])

	const trash = useMemo((): MenuItemType | null => {
		if (!isOwner || note.trash || note.archive) {
			return null
		}

		return {
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
	}, [t, note, isOwner, navigate])

	const restore = useMemo((): MenuItemType | null => {
		if (!isOwner || (!note.trash && !note.archive)) {
			return null
		}

		return {
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
	}, [t, note, isOwner])

	const deleteMenu = useMemo((): MenuItemType | null => {
		if (!isOwner || !note.trash || note.archive) {
			return null
		}

		return {
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
	}, [t, note, isOwner])

	const leave = useMemo((): MenuItemType | null => {
		if (isOwner || !client) {
			return null
		}

		return {
			type: "item",
			inset: true,
			onClick: async () => {
				try {
					await libNotes.leave(note, client.userId)

					navigate({
						to: "/notes"
					})
				} catch (e) {
					console.error(e)
					toasts.error(e)
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
	}, [t, note, isOwner, client, navigate])

	return useMemo((): MenuItemType[] => {
		return [
			...(history ? [history] : []),
			participants,
			type,
			pinned,
			favorited,
			tags,
			...(rename ? [rename] : []),
			duplicate,
			exportMenu,
			...(archive ? [archive] : []),
			...(trash ? [trash] : []),
			...(restore ? [restore] : []),
			...(deleteMenu ? [deleteMenu] : []),
			...(leave ? [leave] : [])
		] satisfies MenuItemType[]
	}, [history, participants, type, pinned, favorited, tags, rename, duplicate, exportMenu, archive, trash, restore, deleteMenu, leave])
}
