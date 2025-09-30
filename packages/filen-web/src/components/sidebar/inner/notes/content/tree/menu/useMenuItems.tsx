import { useMemo } from "react"
import type { MenuItemType } from "@/components/menu"
import type { NoteTag, NoteType } from "@filen/sdk-rs"
import type { DefaultTags } from ".."
import { useTranslation } from "react-i18next"
import { useNavigate } from "@tanstack/react-router"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { HeartIcon, EditIcon, DeleteIcon } from "lucide-react"
import Icon from "@/components/notes/icon"

export function useMenuItems({ tag }: { tag: NoteTag | DefaultTags }): MenuItemType[] {
	const { t } = useTranslation()
	const navigate = useNavigate()

	const create = useMemo((): MenuItemType | null => {
		if (typeof tag === "string") {
			return null
		}

		return {
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
		} satisfies MenuItemType
	}, [tag, t, navigate])

	const favorite = useMemo((): MenuItemType | null => {
		if (typeof tag === "string") {
			return null
		}

		return {
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
		} satisfies MenuItemType
	}, [tag, t])

	const rename = useMemo((): MenuItemType | null => {
		if (typeof tag === "string") {
			return null
		}

		return {
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
		} satisfies MenuItemType
	}, [tag, t])

	const deleteMenu = useMemo((): MenuItemType | null => {
		if (typeof tag === "string") {
			return null
		}

		return {
			type: "item",
			inset: true,
			onClick: async () => {
				try {
					await libNotes.tags.delete(tag)
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
	}, [tag, t])

	return useMemo((): MenuItemType[] => {
		if (typeof tag === "string") {
			return []
		}

		return [
			...(create ? [create] : []),
			...(favorite ? [favorite] : []),
			...(rename ? [rename] : []),
			...(deleteMenu ? [deleteMenu] : [])
		] satisfies MenuItemType[]
	}, [tag, create, favorite, rename, deleteMenu])
}

export default useMenuItems
