import { useMemo, useState, useEffect } from "react"
import {
	Folder,
	ChevronRight,
	NotebookIcon,
	Contact2Icon,
	MessageCircleIcon,
	ImagesIcon,
	PlusIcon,
	HardDriveIcon,
	FolderSyncIcon
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarGroupLabel,
	useSidebar
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "react-i18next"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { orderItemsByType, cn } from "@/lib/utils"
import pathModule from "path"
import { DirectoryIcon } from "./itemIcons"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveParent from "@/hooks/useDriveParent"
import cacheMap from "@/lib/cacheMap"
import { Button } from "./ui/button"
import { IS_DESKTOP } from "@/constants"
import DriveListItemMenu from "./drive/list/item/menu"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { setOpen } = useSidebar()
	const { t } = useTranslation()
	const location = useLocation()
	const driveParent = useDriveParent()

	const driveItemsQuery = useDriveItemsQuery({
		path: "/"
	})

	const items = useMemo(() => {
		if (driveItemsQuery.status !== "success") {
			return []
		}

		return orderItemsByType({
			items: driveItemsQuery.data,
			type: "nameAsc"
		}).filter(item => item.type === "directory")
	}, [driveItemsQuery.status, driveItemsQuery.data])

	return (
		<Sidebar
			collapsible="offcanvas"
			className="overflow-x-hidden *:data-[sidebar=sidebar]:flex-row p-0"
			variant="inset"
			{...props}
		>
			<Sidebar
				collapsible="none"
				className="w-[calc(var(--sidebar-width-icon)+1px)]! overflow-x-hidden p-2 border-r"
			>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem className="z-[10000]">
							<SidebarMenuButton
								size="lg"
								asChild={true}
								className="md:h-8 md:p-0"
							>
								<Link to="/drive">
									<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg p-[6px]">
										<img src="/img/light_logo.svg" />
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent data-dragselectallowed={true}>
					<SidebarGroup>
						<SidebarGroupContent className="px-1.5 md:px-0">
							<SidebarMenu>
								{[
									{
										title: "Drive",
										url: "/drive",
										icon: Folder
									},
									{
										title: "Photos",
										url: "/photos",
										icon: ImagesIcon
									},
									{
										title: "Notes",
										url: "/notes",
										icon: NotebookIcon
									},
									{
										title: "Chats",
										url: "/chats",
										icon: MessageCircleIcon
									},
									{
										title: "Contacts",
										url: "/contacts",
										icon: Contact2Icon
									},
									...(IS_DESKTOP
										? [
												{
													title: "Syncs",
													url: "/syncs",
													icon: FolderSyncIcon
												},
												{
													title: "Mounts",
													url: "/mounts",
													icon: HardDriveIcon
												}
											]
										: [])
								].map(item => (
									<SidebarMenuItem key={item.title}>
										<Link
											to={item.url}
											onClick={() => {
												setOpen(true)
											}}
										>
											<SidebarMenuButton
												tooltip={{
													children: item.title,
													hidden: false
												}}
												isActive={location.pathname.includes(item.url)}
												className="px-2.5 md:px-2 cursor-pointer"
											>
												<item.icon />
												<span>{item.title}</span>
											</SidebarMenuButton>
										</Link>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<NavUser
						user={{
							name: "testnet",
							email: "testnet@example.com",
							avatar: ""
						}}
					/>
				</SidebarFooter>
			</Sidebar>
			<Sidebar
				collapsible="none"
				className="hidden flex-1 md:flex overflow-x-hidden"
			>
				<SidebarHeader
					className="gap-3.5 p-4"
					data-dragselectallowed={true}
				>
					<div className="flex w-full items-center justify-between gap-4">
						<div className="text-foreground text-base font-medium text-ellipsis truncate">
							{cacheMap.directoryUUIDToName.get(driveParent?.uuid ?? "") ?? "Cloud Drive"}
						</div>
						<Button
							size="sm"
							variant="secondary"
						>
							<PlusIcon />
							New
						</Button>
					</div>
					<SidebarInput placeholder="Search..." />
				</SidebarHeader>
				<SidebarContent
					className="overflow-x-hidden overflow-y-auto"
					data-dragselectallowed={true}
				>
					<SidebarGroup className="overflow-x-hidden shrink-0">
						<SidebarGroupLabel>{t("cloudDrive")}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{items.map(dir => (
									<Tree
										key={dir.data.uuid}
										dir={dir}
										level={0}
										path={pathModule.posix.join("/", dir.data.uuid)}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</Sidebar>
	)
}

function Tree({ dir, level, path }: { dir: DriveItem; level: number; path: string }) {
	const drivePath = useDrivePath()
	const navigate = useNavigate()

	const openAsPerDrivePath = useMemo(() => {
		return drivePath.includes(path)
	}, [drivePath, path])

	const [open, setOpen] = useState<boolean>(openAsPerDrivePath)
	const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)

	const driveItemsQuery = useDriveItemsQuery(
		{
			path: pathModule.posix.join(path, dir.data.uuid)
		},
		{
			enabled: open
		}
	)

	const items = useMemo(() => {
		if (driveItemsQuery.status !== "success") {
			return []
		}

		return orderItemsByType({
			items: driveItemsQuery.data,
			type: "nameAsc"
		}).filter(item => item.type === "directory")
	}, [driveItemsQuery.status, driveItemsQuery.data])

	useEffect(() => {
		setOpen(openAsPerDrivePath)
	}, [openAsPerDrivePath])

	return (
		<SidebarMenuItem>
			<Collapsible
				className="group/collapsible [&[data-state=open]>div>button>svg:first-child]:rotate-90"
				style={{
					width: `calc(var(--sidebar-width) - var(--sidebar-width-icon) - ${level * 26 + 16}px)`
				}}
				open={open}
				onOpenChange={setOpen}
			>
				<CollapsibleTrigger asChild={true}>
					<div>
						<DriveListItemMenu
							onOpenChange={setContextMenuOpen}
							item={dir}
							type="context"
						>
							<SidebarMenuButton
								className={cn("overflow-hidden cursor-pointer", contextMenuOpen && "bg-muted")}
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()

									navigate({
										to: pathModule.posix.join("/drive", path)
									})
								}}
							>
								<ChevronRight
									className="transition-transform cursor-pointer"
									onClick={e => {
										e.preventDefault()
										e.stopPropagation()

										setOpen(prev => !prev)
									}}
								/>
								<DirectoryIcon
									color={dir.type === "directory" ? dir.data.color : null}
									width={16}
									height={16}
								/>
								<p className="text-ellipsis truncate">{dir.data.meta?.name ?? pathModule.basename(dir.data.uuid)}</p>
							</SidebarMenuButton>
						</DriveListItemMenu>
					</div>
				</CollapsibleTrigger>
				<CollapsibleContent>
					{open && items.length > 0 ? (
						<SidebarMenuSub>
							{items.map(subDir => (
								<Tree
									key={subDir.data.uuid}
									dir={subDir}
									level={level + 1}
									path={pathModule.posix.join(path, subDir.data.uuid)}
								/>
							))}
						</SidebarMenuSub>
					) : null}
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	)
}
