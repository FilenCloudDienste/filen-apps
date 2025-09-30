import { memo, useCallback, useMemo } from "react"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { Button } from "../../ui/button"
import { NotebookIcon, PlusIcon } from "lucide-react"
import useNotesQuery from "@/queries/useNotes.query"
import { parseNumbersFromString } from "@/lib/utils"
import { useNavigate } from "@tanstack/react-router"
import type { NoteType } from "@filen/sdk-rs"
import { useTranslation } from "react-i18next"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu"
import Icon from "../icon"

export const Empty = memo(() => {
	const navigate = useNavigate()
	const { t } = useTranslation()

	const notesQuery = useNotesQuery({
		enabled: false
	})

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

			if (b.editedTimestamp === a.editedTimestamp) {
				return parseNumbersFromString(b.uuid) - parseNumbersFromString(a.uuid)
			}

			return Number(b.editedTimestamp) - Number(a.editedTimestamp)
		})
	}, [notesQuery.data, notesQuery.status])

	const openLatest = useCallback(() => {
		if (notes.length === 0) {
			return
		}

		const latestNote = notes.at(0)

		if (!latestNote) {
			return
		}

		navigate({
			to: "/notes/$",
			params: {
				_splat: latestNote.uuid
			}
		})
	}, [navigate, notes])

	const create = useCallback(
		async (type?: NoteType) => {
			try {
				const note = await libNotes.create(type)

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
		[navigate]
	)

	return (
		<div className="flex flex-1 flex-col gap-4 items-center justify-center text-muted-foreground px-8">
			<NotebookIcon className="text-muted-foreground shrink size-20" />
			<p className="text-muted-foreground text-sm text-center max-w-[50%]">tbd</p>
			<div className="flex flex-col gap-1">
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							size="sm"
							variant="default"
						>
							<PlusIcon />
							tbd
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="right"
						align="start"
					>
						<DropdownMenuItem onClick={() => create("text")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeText")}</p>
								<Icon
									type="text"
									className="size-[14px]"
								/>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => create("rich")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeRichtext")}</p>
								<Icon
									type="rich"
									className="size-[14px]"
								/>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => create("checklist")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeChecklist")}</p>
								<Icon
									type="checklist"
									className="size-[14px]"
								/>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => create("md")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeMarkdown")}</p>
								<Icon
									type="md"
									className="size-[14px]"
								/>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => create("code")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeCode")}</p>
								<Icon
									type="code"
									className="size-[14px]"
								/>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				{notes.length > 0 && (
					<Button
						onClick={openLatest}
						size="sm"
						variant="link"
						className="text-muted-foreground text-xs"
					>
						tbd
					</Button>
				)}
			</div>
		</div>
	)
})

Empty.displayName = "Empty"

export default Empty
