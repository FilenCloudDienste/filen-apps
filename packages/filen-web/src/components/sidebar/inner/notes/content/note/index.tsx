import { memo, useMemo, useState } from "react"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import { simpleDate, cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import pathModule from "path"
import { PinIcon, HeartIcon, LoaderIcon, Share2Icon } from "lucide-react"
import type { Note as NoteT } from "@filen/sdk-rs"
import useNotesStore from "@/stores/notes.store"
import { useShallow } from "zustand/shallow"
import Menu from "./menu"
import useDragAndDrop from "@/hooks/useDragAndDrop"
import Tags from "./tags"
import Participants from "./participants"
import Icon from "@/components/notes/icon"

export const Note = memo(({ note, fromTree }: { note: NoteT; fromTree?: boolean }) => {
	const { client } = useAuth()
	const { pathname } = useLocation()
	const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
	const syncing = useNotesStore(useShallow(state => state.syncing))

	const isOwner = useMemo(() => {
		return note.ownerId === client?.userId
	}, [note.ownerId, client])

	const activeLink = useMemo(() => {
		return pathModule.posix.basename(pathname)
	}, [pathname])

	const dragAndDrop = useDragAndDrop({
		start: () => {
			useNotesStore.getState().setDraggingNotes([...useNotesStore.getState().draggingNotes.filter(n => n.uuid !== note.uuid), note])
		}
	})

	return (
		<Menu
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
						{...dragAndDrop}
					>
						<div className="flex flex-1 flex-row gap-4 overflow-hidden w-full">
							<div className="flex flex-col gap-2">
								{note.archive ? (
									<Icon
										className="size-5"
										type="archive"
									/>
								) : note.trash ? (
									<Icon
										className="size-5"
										type="trash"
									/>
								) : (
									<div className="flex flex-col gap-2">
										<div>
											<Icon
												type={note.noteType}
												className="size-5"
											/>
										</div>
										<div>{note.pinned && <PinIcon className="size-5 text-muted-foreground shrink-0" />}</div>
									</div>
								)}
							</div>
							<div className="flex flex-1 flex-col gap-2 overflow-hidden">
								<div className="flex flex-1 flex-row items-center gap-2 overflow-hidden">
									{syncing && syncing.uuid === note.uuid && <LoaderIcon className="animate-spin size-4 shrink-0" />}
									{!isOwner && <Share2Icon className="size-4 shrink-0 text-muted-foreground" />}
									{note.favorite && <HeartIcon className="size-4 shrink-0 text-destructive" />}
									<p className="text-md font-semibold truncate text-ellipsis">
										{note.title && note.title.length > 0 ? note.title : simpleDate(Number(note.createdTimestamp))}
									</p>
								</div>
								{note.preview && note.preview.length > 0 && <p className="line-clamp-3 text-ellipsis">{note.preview}</p>}
								<p className="text-xs text-muted-foreground truncate text-ellipsis">
									{simpleDate(Number(note.editedTimestamp))}
								</p>
								<Participants note={note} />
								<Tags note={note} />
							</div>
						</div>
					</SidebarMenuButton>
				</Link>
			</SidebarMenuItem>
		</Menu>
	)
})

Note.displayName = "Note"

export default Note
