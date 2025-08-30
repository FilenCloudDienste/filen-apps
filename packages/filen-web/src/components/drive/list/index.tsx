import { useLocation, useNavigate } from "@tanstack/react-router"
import { memo, useMemo, useRef, useCallback, useState } from "react"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { Virtuoso } from "react-virtuoso"
import { EllipsisVerticalIcon } from "lucide-react"
import { orderItemsByType, formatBytes, simpleDate, cn } from "@/lib/utils"
import { FileIcon, DirectoryIcon } from "@/components/itemIcons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger
} from "@/components/ui/context-menu"
import pathModule from "path"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"
import useDrivePath from "@/hooks/useDrivePath"

export const Row = memo(
	({
		name,
		size,
		modified,
		isHeader,
		item,
		isLast
	}: {
		name: string
		size: number
		modified: number
		isHeader?: boolean
		item?: DriveItem
		isLast?: boolean
	}) => {
		const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
		const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
		const location = useLocation()
		const navigate = useNavigate()
		const isSelected = useDriveStore(useShallow(state => state.selectedItems.some(i => i.data.uuid === item?.data.uuid)))

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

		const onClick = useCallback(() => {
			if (!item) {
				return
			}

			useDriveStore
				.getState()
				.setSelectedItems(prev =>
					prev.some(i => i.data.uuid === item.data.uuid) ? prev.filter(i => i.data.uuid !== item.data.uuid) : [...prev, item]
				)
		}, [item])

		const onDoubleClick = useCallback(() => {
			if (!item) {
				return
			}

			if (item.type === "directory") {
				navigate({
					to: pathModule.posix.join(location.pathname, item.data.uuid)
				})

				return
			}

			console.log("File clicked", item.data.uuid)
		}, [item, location.pathname, navigate])

		return (
			<div
				onClick={onClick}
				className="flex w-full h-auto dragselect-collision-check"
				onDoubleClick={onDoubleClick}
				data-uuid={item?.data.uuid}
				data-dragselectallowed={isHeader}
			>
				<ContextMenu onOpenChange={setContextMenuOpen}>
					<ContextMenuTrigger asChild={true}>
						<div
							ref={contextMenuTriggerRef}
							className={cn("flex w-full flex-row overflow-hidden", !isLast && "border-b")}
							data-dragselectallowed={isHeader}
						>
							<div
								className={cn(
									"flex flex-row w-full gap-8 justify-between overflow-hidden",
									isHeader ? "px-0 pb-1 pr-[24px]" : "px-4 py-2 hover:bg-sidebar",
									(contextMenuOpen || isSelected) && "bg-sidebar"
								)}
								data-dragselectallowed={isHeader}
							>
								<div
									className="flex flex-1 flex-row items-center w-[60%] overflow-hidden gap-4"
									data-dragselectallowed={isHeader}
								>
									{!isHeader && item ? (
										item.type === "directory" ? (
											<HoverCard openDelay={1000}>
												<HoverCardTrigger asChild={true}>
													<div>
														<DirectoryIcon
															color={null}
															width={20}
															height={20}
														/>
													</div>
												</HoverCardTrigger>
												<HoverCardContent
													side="top"
													align="start"
												>
													{isHeader ? "Name" : name}
												</HoverCardContent>
											</HoverCard>
										) : (
											<FileIcon
												fileName={name}
												width={20}
												height={20}
											/>
										)
									) : null}
									<p
										className={cn(
											"text-ellipsis truncate select-none",
											isHeader ? "text-base" : "text-sm font-semibold"
										)}
									>
										{isHeader ? "Name" : name}
									</p>
								</div>
								<div
									className="flex flex-row items-center w-[40%] justify-between overflow-hidden gap-8"
									data-dragselectallowed={isHeader}
								>
									<div
										className="flex flex-row items-center overflow-hidden w-[25%]"
										data-dragselectallowed={isHeader}
									>
										<p className={cn("text-ellipsis truncate select-none", isHeader ? "text-base" : "text-sm")}>
											{isHeader ? "Size" : formatBytes(size)}
										</p>
									</div>
									<div
										className="flex flex-1 flex-row items-center overflow-hidden"
										data-dragselectallowed={isHeader}
									>
										<p className={cn("text-ellipsis truncate select-none", isHeader ? "text-base" : "text-sm")}>
											{isHeader ? "Modified" : simpleDate(modified)}
										</p>
									</div>
									<div
										className="flex flex-row items-center overflow-hidden pr-4"
										data-dragselectallowed={isHeader}
									>
										{isHeader ? null : (
											<Tooltip delayDuration={1000}>
												<TooltipTrigger asChild={true}>
													<Button
														size="icon"
														variant="ghost"
														className="w-7 h-7 hover:bg-secondary-foreground"
														onContextMenu={e => {
															e.preventDefault()
															e.stopPropagation()
														}}
														onClick={openContextMenu}
													>
														<EllipsisVerticalIcon />
													</Button>
												</TooltipTrigger>
												<TooltipContent
													side="top"
													align="center"
													className="select-none"
												>
													More actions
												</TooltipContent>
											</Tooltip>
										)}
									</div>
								</div>
							</div>
						</div>
					</ContextMenuTrigger>
					<ContextMenuContent className="w-52">
						<ContextMenuItem
							inset
							onClick={() => {
								alert("Download clicked")
							}}
						>
							Download
							<ContextMenuShortcut>⌘[</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem inset>
							Back
							<ContextMenuShortcut>⌘[</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem
							inset
							disabled
						>
							Forward
							<ContextMenuShortcut>⌘]</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuItem inset>
							Reload
							<ContextMenuShortcut>⌘R</ContextMenuShortcut>
						</ContextMenuItem>
						<ContextMenuSub>
							<ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
							<ContextMenuSubContent className="w-44">
								<ContextMenuItem>Save Page...</ContextMenuItem>
								<ContextMenuItem>Create Shortcut...</ContextMenuItem>
								<ContextMenuItem>Name Window...</ContextMenuItem>
								<ContextMenuSeparator />
								<ContextMenuItem>Developer Tools</ContextMenuItem>
								<ContextMenuSeparator />
								<ContextMenuItem>Delete</ContextMenuItem>
							</ContextMenuSubContent>
						</ContextMenuSub>
						<ContextMenuSeparator />
						<ContextMenuCheckboxItem checked>Show Bookmarks</ContextMenuCheckboxItem>
						<ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
						<ContextMenuSeparator />
						<ContextMenuRadioGroup value="pedro">
							<ContextMenuLabel inset>People</ContextMenuLabel>
							<ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
							<ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
						</ContextMenuRadioGroup>
					</ContextMenuContent>
				</ContextMenu>
			</div>
		)
	}
)

Row.displayName = "Row"

export const DriveList = memo(() => {
	const drivePath = useDrivePath()

	const driveItemsQuery = useDriveItemsQuery({
		path: drivePath
	})

	const items = useMemo(() => {
		if (driveItemsQuery.status !== "success") {
			return []
		}

		return orderItemsByType({
			items: driveItemsQuery.data,
			type: "nameAsc"
		})
	}, [driveItemsQuery.status, driveItemsQuery.data])

	return (
		<div
			className="flex flex-1 flex-col px-4"
			data-dragselectallowed={true}
		>
			<Row
				isHeader={true}
				name=""
				size={0}
				modified={0}
			/>
			<ContextMenu>
				<ContextMenuTrigger asChild={true}>
					<Virtuoso
						key={drivePath}
						className="w-full h-full flex flex-1 overflow-x-hidden overflow-y-scroll"
						data={items}
						data-dragselectallowed={true}
						computeItemKey={(_, item) => item.data.uuid}
						totalCount={items.length}
						defaultItemHeight={45}
						fixedItemHeight={45}
						skipAnimationFrameInResizeObserver={true}
						components={{
							List: props => (
								<div
									{...props}
									data-dragselectallowed={true}
								/>
							),
							Scroller: props => (
								<div
									{...props}
									data-dragselectallowed={true}
								/>
							)
						}}
						itemContent={(index, item) => (
							<Row
								item={item}
								name={item.data.meta?.name ?? ""}
								size={item.type === "directory" ? 0 : item.data.meta?.size ? Number(item.data.meta.size) : 0}
								modified={
									item.type === "directory"
										? item.data.meta?.created
											? Number(item.data.meta?.created)
											: Date.now()
										: item.data.meta?.modified
											? Number(item.data.meta?.modified)
											: Date.now()
								}
								isLast={index === items.length - 1}
							/>
						)}
					/>
				</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					<ContextMenuItem
						inset
						onClick={() => {
							alert("Download clicked")
						}}
					>
						Download
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem inset>
						Back
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	)
})

DriveList.displayName = "DriveList"

export default DriveList
