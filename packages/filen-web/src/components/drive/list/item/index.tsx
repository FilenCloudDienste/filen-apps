import { useLocation, useNavigate } from "@tanstack/react-router"
import { memo, useRef, useCallback, useState } from "react"
import type { DriveItem } from "@/queries/useDriveItems.query"
import { EllipsisVerticalIcon } from "lucide-react"
import { formatBytes, simpleDate, cn } from "@/lib/utils"
import { FileIcon, DirectoryIcon } from "@/components/itemIcons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import DriveListItemHoverCard from "./hoverCard"
import pathModule from "path"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"
import DriveListItemContextMenu from "./contextMenu"

import { grid } from "../index"

export const DriveListItem = memo(
	({ item, isLast, items, index }: { item: DriveItem; isLast: boolean; items: DriveItem[]; index: number }) => {
		const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
		const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
		const [draggingOver, setDraggingOver] = useState<boolean>(false)
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

		const onClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.preventDefault()
				e.stopPropagation()

				if (e.ctrlKey || e.metaKey || e.altKey) {
					useDriveStore
						.getState()
						.setSelectedItems(prev =>
							prev.some(i => i.data.uuid === item.data.uuid)
								? prev.filter(i => i.data.uuid !== item.data.uuid)
								: [...prev.filter(i => i.data.uuid !== item.data.uuid), item]
						)

					return
				}

				if (e.shiftKey) {
					const currentSelectedItems = useDriveStore.getState().selectedItems

					if (currentSelectedItems.length === 0) {
						useDriveStore
							.getState()
							.setSelectedItems(prev =>
								prev.some(i => i.data.uuid === item.data.uuid) ? prev.filter(i => i.data.uuid !== item.data.uuid) : [item]
							)

						return
					}

					const firstSelectedItemIndex = items.findIndex(i => currentSelectedItems.some(s => s.data.uuid === i.data.uuid))

					if (firstSelectedItemIndex === -1) {
						return
					}

					const start = Math.min(firstSelectedItemIndex, index)
					const end = Math.max(firstSelectedItemIndex, index)

					if (start === end) {
						useDriveStore
							.getState()
							.setSelectedItems(prev =>
								prev.some(i => i.data.uuid === item.data.uuid) ? prev.filter(i => i.data.uuid !== item.data.uuid) : [item]
							)

						return
					}

					useDriveStore.getState().setSelectedItems(items.slice(start, end + 1))

					return
				}

				useDriveStore.getState().setSelectedItems(prev => (prev.some(i => i.data.uuid === item.data.uuid) ? [] : [item]))
			},
			[item, index, items]
		)

		const onDoubleClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.preventDefault()
				e.stopPropagation()

				if (item.type === "directory") {
					navigate({
						to: pathModule.posix.join(location.pathname, item.data.uuid)
					})

					return
				}

				console.log("File clicked", item.data.uuid)
			},
			[item, location.pathname, navigate]
		)

		const onContextMenuOpenChange = useCallback(
			(open: boolean) => {
				setContextMenuOpen(open)

				if (open && item) {
					useDriveStore
						.getState()
						.setSelectedItems(prev =>
							prev.some(i => i.data.uuid === item.data.uuid)
								? [...prev.filter(i => i.data.uuid !== item.data.uuid), item]
								: [item]
						)
				}
			},
			[item]
		)

		const onDragStart = useCallback(() => {
			useDriveStore.getState().setSelectedItems(prev => [...prev.filter(i => i.data.uuid !== item.data.uuid), item])
			useDriveStore
				.getState()
				.setDraggingItems([...useDriveStore.getState().selectedItems.filter(i => i.data.uuid !== item.data.uuid), item])
		}, [item])

		const onDragOver = useCallback(
			(e: React.DragEvent) => {
				if (item.type !== "directory") {
					return
				}

				e.preventDefault()

				setDraggingOver(true)
			},
			[item]
		)

		const onDragLeave = useCallback(
			(e: React.DragEvent) => {
				if (item.type !== "directory") {
					return
				}

				e.preventDefault()

				setDraggingOver(false)
			},
			[item]
		)

		const onDrop = useCallback(
			(e: React.DragEvent) => {
				e.preventDefault()

				try {
					if (item.type !== "directory") {
						return
					}

					setDraggingOver(false)

					const draggingItems = useDriveStore.getState().draggingItems

					if (draggingItems.some(i => i.data.uuid === item.data.uuid)) {
						return
					}

					console.log(
						"move",
						draggingItems.map(i => i.data.uuid),
						"to",
						item.data.uuid
					)
				} finally {
					useDriveStore.getState().setSelectedItems([])
					useDriveStore.getState().setDraggingItems([])
				}
			},
			[item]
		)

		return (
			<div
				onClick={onClick}
				className="flex w-full h-auto dragselect-collision-check"
				onDoubleClick={onDoubleClick}
				data-uuid={item?.data.uuid}
				draggable={true}
				onDragStart={onDragStart}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
			>
				<DriveListItemContextMenu
					onOpenChange={onContextMenuOpenChange}
					item={item}
				>
					{grid ? (
						<div
							ref={contextMenuTriggerRef}
							className={cn(
								"flex flex-1 flex-col gap-2 items-center justify-center hover:bg-sidebar p-4 rounded-lg w-full overflow-hidden shrink-0",
								(contextMenuOpen || isSelected || draggingOver) && "bg-sidebar",
								draggingOver && "animate-pulse"
							)}
						>
							<div>
								{item.type === "directory" ? (
									<DriveListItemHoverCard item={item}>
										<div>
											<DirectoryIcon
												color={item.data.color}
												width={64}
												height={64}
											/>
										</div>
									</DriveListItemHoverCard>
								) : (
									<FileIcon
										fileName={item.data.meta?.name ?? item.data.uuid}
										width={64}
										height={64}
									/>
								)}
							</div>
							<p className="text-ellipsis truncate select-none px-4">{item.data.meta?.name ?? item.data.uuid}</p>
						</div>
					) : (
						<div
							ref={contextMenuTriggerRef}
							className={cn("flex w-full flex-row overflow-hidden", !isLast && "border-b")}
						>
							<div
								className={cn(
									"flex flex-row w-full gap-8 justify-between overflow-hidden px-4 py-2 hover:bg-sidebar",
									(contextMenuOpen || isSelected || draggingOver) && "bg-sidebar",
									draggingOver && "animate-pulse"
								)}
							>
								<div className="flex flex-1 flex-row items-center w-[60%] overflow-hidden gap-4">
									{item.type === "directory" ? (
										<DriveListItemHoverCard item={item}>
											<div>
												<DirectoryIcon
													color={item.data.color}
													width={20}
													height={20}
												/>
											</div>
										</DriveListItemHoverCard>
									) : (
										<FileIcon
											fileName={item.data.meta?.name ?? item.data.uuid}
											width={20}
											height={20}
										/>
									)}
									<p className="text-ellipsis truncate select-none">{item.data.meta?.name ?? item.data.uuid}</p>
								</div>
								<div className="flex flex-row items-center w-[40%] justify-between overflow-hidden gap-8">
									<div className="flex flex-row items-center overflow-hidden w-[25%]">
										<p className="text-ellipsis truncate select-none text-sm">
											{formatBytes(item.type === "directory" ? 0 : Number(item.data.size))}
										</p>
									</div>
									<div className="flex flex-1 flex-row items-center overflow-hidden">
										<p className="text-ellipsis truncate select-none text-sm">
											{simpleDate(
												item.type === "directory"
													? Number(item.data.meta?.created ?? Date.now())
													: Number(item.data.meta?.modified ?? Date.now())
											)}
										</p>
									</div>
									<div className="flex flex-row items-center overflow-hidden pr-4">
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
									</div>
								</div>
							</div>
						</div>
					)}
				</DriveListItemContextMenu>
			</div>
		)
	}
)

DriveListItem.displayName = "DriveListItem"

export default DriveListItem
