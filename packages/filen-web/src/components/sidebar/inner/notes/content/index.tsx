import { memo, useMemo, Fragment, useCallback } from "react"
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu } from "@/components/ui/sidebar"
import useNotesQuery from "@/queries/useNotes.query"
import { TabsContent } from "@/components/ui/tabs"
import useNotesTagsQuery from "@/queries/useNotesTags.query"
import type { NoteTag, Note as NoteT } from "@filen/sdk-rs"
import { Virtuoso } from "react-virtuoso"
import Tree, { type DefaultTags } from "./tree"
import Note from "./note"
import { parseNumbersFromString } from "@/lib/utils"
import useIdb from "@/hooks/useIdb"
import { Skeleton } from "@/components/ui/skeleton"

export const Content = memo(() => {
	const notesQuery = useNotesQuery()
	const notesTagsQuery = useNotesTagsQuery()
	const [notesSidebarSearch] = useIdb<string>("notesSidebarSearch", "")

	const notes = useMemo(() => {
		if (notesQuery.status !== "success") {
			return []
		}

		const searchNormalized = notesSidebarSearch.trim().toLowerCase()

		return (
			searchNormalized.length > 0
				? notesQuery.data.filter(note => {
						if (searchNormalized.length === 0) {
							return true
						}

						const titleNormalized = (note.title ?? note.uuid).toLowerCase()
						const previewNormalized = (note.preview ?? note.uuid).toLowerCase()
						const tagsNormalized = note.tags.map(t => (t.name ?? t.uuid).toLowerCase())

						return (
							titleNormalized.includes(searchNormalized) ||
							previewNormalized.includes(searchNormalized) ||
							tagsNormalized.some(t => t.includes(searchNormalized))
						)
					})
				: notesQuery.data
		).sort((a, b) => {
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

			if (b.editedTimestamp === a.editedTimestamp) {
				return parseNumbersFromString(b.uuid) - parseNumbersFromString(a.uuid)
			}

			return Number(b.editedTimestamp) - Number(a.editedTimestamp)
		})
	}, [notesQuery.data, notesQuery.status, notesSidebarSearch])

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

		const searchNormalized = notesSidebarSearch.trim().toLowerCase()

		return (
			[
				"favorited",
				"pinned",
				"shared",
				...(searchNormalized.length > 0
					? notesTagsQuery.data.filter(tag => (tag.name ?? tag.uuid).toLowerCase().includes(searchNormalized))
					: notesTagsQuery.data
				).sort((a, b) =>
					(a.name ?? a.uuid).localeCompare(b.name ?? b.uuid, "en", {
						numeric: true
					})
				),
				"archived",
				"trash"
			] satisfies (NoteTag | DefaultTags)[]
		).filter(tag => (typeof tag === "string" || notesSidebarSearch.trim().length > 0 ? treeItemsForTag(tag).length > 0 : true))
	}, [notesTagsQuery.data, notesTagsQuery.status, treeItemsForTag, notesSidebarSearch])

	const computeItemKeyNotes = useCallback((_: number, note: NoteT) => note.uuid, [])

	const computeItemKeyNotesTags = useCallback((_: number, tag: NoteTag | DefaultTags) => (typeof tag === "string" ? tag : tag.uuid), [])

	const itemContentNotes = useCallback((_: number, note: NoteT) => {
		return <Note note={note} />
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

	const EmptyPlaceholder = useCallback(() => {
		if (notesQuery.status !== "success" || notesTagsQuery.status !== "success") {
			return (
				<div className="flex flex-1 flex-col px-4 w-full h-full overflow-hidden">
					{Array.from({
						length: Math.max(Math.ceil(window.innerHeight / 32 / 3), 3)
					}).map((_, i) => (
						<div
							key={i}
							className="flex flex-row items-center justify-center py-2"
							style={{
								height: "32px",
								width: "100%"
							}}
						>
							<Skeleton className="h-full w-full rounded-lg" />
						</div>
					))}
				</div>
			)
		}

		if (notesSidebarSearch.trim().length > 0) {
			return <div className="flex flex-1 w-full h-full items-center justify-center text-muted-foreground">tbd</div>
		}

		return <div className="flex flex-1 w-full h-full items-center justify-center text-muted-foreground">tbd</div>
	}, [notesQuery.status, notesTagsQuery.status, notesSidebarSearch])

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
									components={{
										EmptyPlaceholder
									}}
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
									components={{
										EmptyPlaceholder
									}}
								/>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</TabsContent>
		</Fragment>
	)
})

Content.displayName = "Content"

export default Content
