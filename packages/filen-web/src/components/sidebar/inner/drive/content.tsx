import { useMemo, useState, useEffect, memo } from "react"
import { ChevronRight } from "lucide-react"
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarGroupLabel
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "react-i18next"
import { useNavigate } from "@tanstack/react-router"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { orderItemsByType, cn } from "@/lib/utils"
import pathModule from "path"
import { DirectoryIcon } from "@/components/itemIcons"
import useDrivePath from "@/hooks/useDrivePath"
import DriveListItemMenu from "@/components/drive/list/item/menu"

export const Tree = memo(({ dir, level, path }: { dir: DriveItem; level: number; path: string }) => {
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
					width: `calc(var(--sidebar-width) - var(--sidebar-width-icon) - ${level * 26 + 32}px)`
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
})

Tree.displayName = "Tree"

export const Content = memo(() => {
	const { t } = useTranslation()

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
		<SidebarContent
			className="overflow-x-hidden overflow-y-auto px-2"
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
	)
})

Content.displayName = "Content"

export default Content
