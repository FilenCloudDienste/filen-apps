import { memo, useMemo, Fragment, useState } from "react"
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
import { simpleDate, cn } from "@/lib/utils"
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
import { PinIcon, HeartIcon, ChevronRightIcon, HashIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TabsContent } from "@/components/ui/tabs"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import type { NoteTag, Note } from "@filen/sdk-rs"

export const Tree = memo(({ tag, notes }: { tag: NoteTag; notes: Note[] }) => {
	const [open, setOpen] = useState<boolean>(false)
	const [contextMenuOpen] = useState<boolean>(false)
	const navigate = useNavigate()

	return (
		<SidebarMenuItem>
			<Collapsible
				className="group/collapsible [&[data-state=open]>div>button>svg:first-child]:rotate-90"
				style={{
					width: "calc(var(--sidebar-width) - var(--sidebar-width-icon) - 32px)"
				}}
				open={open}
				onOpenChange={setOpen}
			>
				<CollapsibleTrigger asChild={true}>
					<div>
						<SidebarMenuButton
							className={cn("overflow-hidden cursor-pointer", contextMenuOpen && "bg-muted")}
							onClick={e => {
								e.preventDefault()
								e.stopPropagation()

								navigate({
									to: pathModule.posix.join("/notes", tag.uuid)
								})
							}}
						>
							<ChevronRightIcon
								className="transition-transform cursor-pointer"
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()

									setOpen(prev => !prev)
								}}
							/>
							<HashIcon className="text-muted-foreground size-4" />
							<p className="text-ellipsis truncate">{tag.name ?? tag.uuid}</p>
						</SidebarMenuButton>
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					{open && notes.length > 0 ? (
						<SidebarMenuSub className="pl-4 w-full">
							{notes.map(note => (
								<NoteComp
									key={note.uuid}
									note={note}
									fromTree={true}
								/>
							))}
						</SidebarMenuSub>
					) : null}
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	)
})

Tree.displayName = "Tree"

export const NoteComp = memo(({ note, fromTree }: { note: Note; fromTree?: boolean }) => {
	const { client } = useAuth()
	const { pathname } = useLocation()

	const activeLink = useMemo(() => {
		return pathModule.posix.basename(pathname)
	}, [pathname])

	return (
		<SidebarMenuItem key={note.uuid}>
			<Link
				to="/notes/$"
				params={{
					_splat: note.uuid
				}}
			>
				<SidebarMenuButton
					isActive={activeLink === note.uuid}
					className={cn(
						"cursor-pointer flex flex-1 flex-col px-4 h-auto items-start data-[active=true]:font-normal",
						!fromTree && "rounded-none"
					)}
				>
					<div className="flex flex-1 flex-row gap-4 overflow-hidden w-full">
						<div className="flex flex-col gap-2">
							{note.archive ? (
								<IoArchiveOutline
									className="size-5"
									color="#eab308"
								/>
							) : note.trash ? (
								<IoTrashOutline
									className="size-5"
									color="#ef4444"
								/>
							) : (
								<div className="flex flex-col gap-2">
									<Tooltip delayDuration={1000}>
										<TooltipTrigger asChild={true}>
											<div>
												{note.note_type === "text" && (
													<IoTextOutline
														className="size-5"
														color="#3b82f6"
													/>
												)}
												{note.note_type === "md" && (
													<IoLogoMarkdown
														className="size-5"
														color="#6366f1"
													/>
												)}
												{note.note_type === "code" && (
													<IoCodeOutline
														className="size-5"
														color="#ef4444"
													/>
												)}
												{note.note_type === "rich" && (
													<IoDocumentTextOutline
														className="size-5"
														color="#06b6d4"
													/>
												)}
												{note.note_type === "checklist" && (
													<IoCheckboxOutline
														className="size-5"
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
													<PinIcon className="size-5 text-muted-foreground" />
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
								{note.favorite && (
									<Tooltip delayDuration={1000}>
										<TooltipTrigger asChild={true}>
											<HeartIcon
												className="size-4 shrink-0"
												color="#ef4444"
											/>
										</TooltipTrigger>
										<TooltipContent>tbd</TooltipContent>
									</Tooltip>
								)}
								<p className="text-md font-semibold truncate text-ellipsis">{note.title ?? "No title"}</p>
							</div>
							<p className="line-clamp-2 text-ellipsis">{note.preview ?? "No preview"}</p>
							<p className="text-xs text-muted-foreground truncate text-ellipsis">
								{simpleDate(Number(note.edited_timestamp))}
							</p>
							{note.participants.filter(participant => participant.user_id !== client?.userId).length > 0 && (
								<div className="flex flex-row items-center gap-2 flex-wrap">
									{note.participants
										.filter(participant => participant.user_id !== client?.userId)
										.map(participant => (
											<Avatar
												key={participant.user_id}
												name={participant.email}
												src={participant.avatar}
												width={20}
												height={20}
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

			return Number(b.edited_timestamp) - Number(a.edited_timestamp)
		})
	}, [notesQuery.data, notesQuery.status])

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

	return (
		<Fragment>
			<TabsContent
				value="account"
				className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto w-full h-full pb-40"
			>
				<SidebarContent className="px-0">
					<SidebarGroup className="overflow-x-hidden shrink-0 px-0">
						<SidebarGroupContent>
							<SidebarMenu className="gap-0">
								{notes.map(note => (
									<NoteComp
										key={note.uuid}
										note={note}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</TabsContent>
			<TabsContent
				value="password"
				className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto w-full h-full pb-40"
			>
				<SidebarContent className="overflow-x-hidden overflow-y-auto px-2">
					<SidebarGroup className="overflow-x-hidden shrink-0">
						<SidebarGroupContent>
							<SidebarMenu>
								{notesTags.map(tag => (
									<Tree
										key={tag.uuid}
										tag={tag}
										notes={notes.filter(note => note.tags.some(t => t.uuid === tag.uuid))}
									/>
								))}
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
