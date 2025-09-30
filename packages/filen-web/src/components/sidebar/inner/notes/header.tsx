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
import Icon from "@/components/notes/icon"
import type { NoteType } from "@filen/sdk-rs"
import toasts from "@/lib/toasts"
import { cn } from "@/lib/utils"

export const Header = memo(() => {
	const { t } = useTranslation()
	const [notesSidebarSearch, setNotesSidebarSearch] = useIdb<string>("notesSidebarSearch", "")
	const navigate = useNavigate()
	const [notesSidebarDefaultTab] = useIdb<"all" | "tags">("notesSidebarDefaultTab", "all")

	const create = useCallback(
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

Header.displayName = "Header"

export default Header
