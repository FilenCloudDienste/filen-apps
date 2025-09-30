import { memo, useMemo, Fragment, useState, useCallback, useRef } from "react"
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { PinIcon, HeartIcon, ChevronRightIcon, HashIcon, EllipsisVerticalIcon, Share2Icon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import type { NoteTag, Note as NoteT } from "@filen/sdk-rs"
import useIdb from "@/hooks/useIdb"
import useNoteUuidFromPathname from "@/hooks/useNoteUuidFromPathname"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { useTranslation } from "react-i18next"
import useNotesStore from "@/stores/notes.store"
import Note from "@/components/sidebar/inner/notes/content/note"
import Menu from "./menu"
import useDragAndDrop from "@/hooks/useDragAndDrop"
import Icon from "@/components/notes/icon"

export type DefaultTags = "favorited" | "pinned" | "archived" | "shared" | "trash"

export const Tree = memo(({ tag, notes }: { tag: NoteTag | DefaultTags; notes: NoteT[] }) => {
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

	const dragAndDrop = useDragAndDrop({
		over: e => {
			if (typeof tag === "string" && tag === "shared") {
				return
			}

			const draggingNotes = useNotesStore.getState().draggingNotes

			if (
				draggingNotes.length === 0 ||
				draggingNotes.some(n =>
					n.tags.map(t => t.uuid).includes(typeof tag === "string" ? (tag as unknown as NoteTag["uuid"]) : tag.uuid)
				)
			) {
				return
			}

			e.preventDefault()

			setDraggingOver(true)
		},
		leave: e => {
			e.preventDefault()

			setDraggingOver(false)
		},
		drop: async e => {
			e.preventDefault()

			try {
				if (typeof tag === "string" && tag === "shared") {
					return
				}

				setDraggingOver(false)

				const draggingNotes = useNotesStore.getState().draggingNotes

				if (
					draggingNotes.length === 0 ||
					draggingNotes.some(n =>
						n.tags.map(t => t.uuid).includes(typeof tag === "string" ? (tag as unknown as NoteTag["uuid"]) : tag.uuid)
					)
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
		}
	})

	return (
		<Menu
			type="context"
			onOpenChange={setContextMenuOpen}
			tag={tag}
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
								{...dragAndDrop}
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
											{tag === "archived" && (
												<Icon
													type="archive"
													className="size-4"
												/>
											)}
											{tag === "favorited" && <HeartIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "pinned" && <PinIcon className="text-muted-foreground size-4 shrink-0" />}
											{tag === "trash" && (
												<Icon
													type="trash"
													className="size-4"
												/>
											)}
											{tag === "shared" && <Share2Icon className="text-muted-foreground size-4 shrink-0" />}
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
									<Note
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

export default Tree
