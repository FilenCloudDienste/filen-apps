import { memo, useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { SidebarHeader, SidebarInput } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import useIdb from "@/hooks/useIdb"
import notes from "@/lib/notes"
import { useNavigate } from "@tanstack/react-router"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { IoTextOutline, IoLogoMarkdown, IoCodeOutline, IoDocumentTextOutline, IoCheckboxOutline } from "react-icons/io5"
import type { NoteType } from "@filen/sdk-rs"
import toasts from "@/lib/toasts"
import { cn } from "@/lib/utils"

export const InnerSidebarNotesHeader = memo(() => {
	const { t } = useTranslation()
	const [notesSidebarSearch, setNotesSidebarSearch] = useIdb<string>("notesSidebarSearch", "")
	const navigate = useNavigate()
	const [notesSidebarDefaultTab] = useIdb<"all" | "tags">("notesSidebarDefaultTab", "all")

	const add = useCallback(
		async (type?: NoteType) => {
			try {
				const note = await notes.create(type)

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

	const addTag = useCallback(async () => {
		try {
			await notes.tags.create()
		} catch (e) {
			console.error(e)
			toasts.error(e)
		}
	}, [])

	const onSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setNotesSidebarSearch(e.target.value)
		},
		[setNotesSidebarSearch]
	)

	return (
		<SidebarHeader className="gap-3.5 p-4 pb-0">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="text-foreground text-base font-medium text-ellipsis truncate">{t("sidebar.inner.notes.title")}</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							size="sm"
							variant="secondary"
						>
							<PlusIcon />
							{t("sidebar.inner.notes.new")}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="right"
						align="start"
					>
						<DropdownMenuItem onClick={() => add("text")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeText")}</p>
								<IoTextOutline color="#3b82f6" />
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => add("rich")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeRichtext")}</p>
								<IoDocumentTextOutline color="#06b6d4" />
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => add("checklist")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeChecklist")}</p>
								<IoCheckboxOutline color="#a855f7" />
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => add("md")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeMarkdown")}</p>
								<IoLogoMarkdown color="#6366f1" />
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => add("code")}>
							<div className="flex flex-row items-center gap-8 w-full justify-between">
								<p>{t("notes.menu.typeCode")}</p>
								<IoCodeOutline color="#ef4444" />
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<SidebarInput
				placeholder="tbd"
				value={notesSidebarSearch}
				onChange={onSearchChange}
			/>
			<div className="flex flex-1 flex-row items-center justify-between w-full">
				<TabsList className="h-8">
					<TabsTrigger
						className="h-6 cursor-pointer"
						value="all"
					>
						tbd
					</TabsTrigger>
					<TabsTrigger
						className="h-6 cursor-pointer"
						value="tags"
					>
						tbd
					</TabsTrigger>
				</TabsList>
				<Button
					size="sm"
					variant="secondary"
					onClick={addTag}
					className={cn(
						"transition-opacity",
						notesSidebarDefaultTab === "tags" ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"
					)}
				>
					<PlusIcon />
					{t("notes.tag")}
				</Button>
			</div>
		</SidebarHeader>
	)
})

InnerSidebarNotesHeader.displayName = "InnerSidebarNotesHeader"

export default InnerSidebarNotesHeader
