import { memo, useRef, useCallback, useState, useMemo, Fragment } from "react"
import type { DriveItem, DriveItemFile } from "@/queries/useDriveItems.query"
import { EllipsisVerticalIcon } from "lucide-react"
import { formatBytes, simpleDate, cn, getPreviewType } from "@/lib/utils"
import { DirectoryIcon } from "@/components/itemIcons"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import DriveListItemHoverCard from "./hoverCard"
import pathModule from "path"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"
import DriveListItemMenu from "./menu"
import usePreviewStore from "@/stores/preview.store"
import useDirectorySizeQuery from "@/queries/useDirectorySize.query"
import Thumbnail from "@/components/thumbnail"
import { Checkbox } from "@/components/ui/checkbox"
import { useSelectDriveItemPromptStore } from "@/components/prompts/selectDriveItem"
import useDragAndDrop from "@/hooks/useDragAndDrop"

export type DriveListItemFrom = "drive" | "select" | "search"

export const MenuWrapper = memo(
	({
		onOpenChange,
		item,
		from,
		children
	}: {
		onOpenChange: (open: boolean) => void
		item: DriveItem
		from: DriveListItemFrom
		children: React.ReactNode
	}) => {
		if (from !== "drive") {
			return <Fragment>{children}</Fragment>
		}

		return (
			<DriveListItemMenu
				onOpenChange={onOpenChange}
				item={item}
				type="context"
			>
				{children}
			</DriveListItemMenu>
		)
	}
)

MenuWrapper.displayName = "MenuWrapper"

export const DriveListItem = memo(
	({
		item,
		isLast,
		items,
		index,
		type,
		from,
		navigate,
		path
	}: {
		item: DriveItem
		isLast: boolean
		items: DriveItem[]
		index: number
		type: "list" | "grid"
		from: DriveListItemFrom
		navigate: (newPath: string) => void
		path: string
	}) => {
		const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
		const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
		const [draggingOver, setDraggingOver] = useState<boolean>(false)
		const isSelectedDrive = useDriveStore(useShallow(state => state.selectedItems.some(i => i.data.uuid === item.data.uuid)))
		const isSelectedPrompt = useSelectDriveItemPromptStore(
			useShallow(state => state.selected.some(i => i.data.uuid === item.data.uuid))
		)
		const selectTypes = useSelectDriveItemPromptStore(useShallow(state => state.types))

		const directorySizeQuery = useDirectorySizeQuery(
			{
				uuid: item.data.uuid
			},
			{
				enabled: item.type === "directory"
			}
		)

		const isSelected = useMemo(() => {
			return from === "drive" ? isSelectedDrive : isSelectedPrompt
		}, [isSelectedDrive, isSelectedPrompt, from])

		const openContextMenu = useCallback(
			(e: React.MouseEvent) => {
				if (from !== "drive") {
					return
				}

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
			},
			[from]
		)

		const onClick = useCallback(
			(e?: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>) => {
				e?.preventDefault()
				e?.stopPropagation()

				if (from === "select" && selectTypes && !selectTypes.includes(item.type)) {
					return
				}

				const selectFn =
					from === "select" ? useSelectDriveItemPromptStore.getState().setSelected : useDriveStore.getState().setSelectedItems

				if (e && (e.ctrlKey || e.metaKey || e.altKey)) {
					selectFn(prev =>
						prev.some(i => i.data.uuid === item.data.uuid)
							? prev.filter(i => i.data.uuid !== item.data.uuid)
							: [...prev.filter(i => i.data.uuid !== item.data.uuid), item]
					)

					return
				}

				if (e && e.shiftKey) {
					const currentSelectedItems =
						from === "select" ? useSelectDriveItemPromptStore.getState().selected : useDriveStore.getState().selectedItems

					if (currentSelectedItems.length === 0) {
						selectFn(prev =>
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
						selectFn(prev =>
							prev.some(i => i.data.uuid === item.data.uuid) ? prev.filter(i => i.data.uuid !== item.data.uuid) : [item]
						)

						return
					}

					selectFn(items.slice(start, end + 1))

					return
				}

				if (from === "select") {
					const multiple = useSelectDriveItemPromptStore.getState().multiple

					selectFn(prev => {
						const exists = prev.some(i => i.data.uuid === item.data.uuid)

						if (multiple) {
							if (exists) {
								return prev.filter(i => i.data.uuid !== item.data.uuid)
							} else {
								return [...prev, item]
							}
						} else {
							if (exists) {
								return []
							} else {
								return [item]
							}
						}
					})
				} else {
					selectFn(prev => (prev.some(i => i.data.uuid === item.data.uuid) ? [] : [item]))
				}
			},
			[item, index, items, from, selectTypes]
		)

		const onDoubleClick = useCallback(
			(e: React.MouseEvent<HTMLDivElement>) => {
				e.preventDefault()
				e.stopPropagation()

				if (item.type === "directory") {
					navigate(pathModule.posix.join(path, item.data.uuid))

					return
				}

				if (from !== "drive") {
					return
				}

				if (getPreviewType(item.data.meta?.name ?? "") === "unknown") {
					openContextMenu(e)

					return
				}

				const previewItems = items
					.map(i => (i.type === "file" ? i.data : null))
					.filter(i => Boolean(i) && getPreviewType(i?.meta?.name ?? "") !== "unknown") as DriveItemFile[]

				if (previewItems.length === 0) {
					return
				}

				const initialIndex = previewItems.findIndex(i => i.uuid === item.data.uuid)

				if (initialIndex === -1) {
					return
				}

				usePreviewStore.getState().show({
					items: previewItems,
					initialIndex
				})
			},
			[item, navigate, items, path, from, openContextMenu]
		)

		const onContextMenuOpenChange = useCallback(
			(open: boolean) => {
				if (from !== "drive") {
					return
				}

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
			[item, from]
		)

		const dragAndDrop = useDragAndDrop({
			start: () => {
				if (from !== "drive") {
					return
				}

				useDriveStore.getState().setSelectedItems(prev => [...prev.filter(i => i.data.uuid !== item.data.uuid), item])
				useDriveStore
					.getState()
					.setDraggingItems([...useDriveStore.getState().selectedItems.filter(i => i.data.uuid !== item.data.uuid), item])
			},
			over: e => {
				if (item.type !== "directory" || from !== "drive") {
					return
				}

				const draggingItems = useDriveStore.getState().draggingItems

				if (draggingItems.some(i => i.data.uuid === item.data.uuid)) {
					return
				}

				e.preventDefault()

				setDraggingOver(true)
			},
			leave: e => {
				if (item.type !== "directory" || from !== "drive") {
					return
				}

				e.preventDefault()

				setDraggingOver(false)
			},
			drop: e => {
				e.preventDefault()

				try {
					if (item.type !== "directory" || from !== "drive") {
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
			}
		})

		return (
			<div
				onClick={onClick}
				className={cn("flex w-full h-auto", from === "drive" && "dragselect-collision-check")}
				onDoubleClick={onDoubleClick}
				data-uuid={item.data.uuid}
				draggable={from === "drive"}
				{...dragAndDrop}
			>
				<MenuWrapper
					onOpenChange={onContextMenuOpenChange}
					item={item}
					from={from}
				>
					{type === "grid" ? (
						<div
							ref={contextMenuTriggerRef}
							className={cn(
								"flex flex-1 flex-col gap-2 items-center justify-center hover:bg-sidebar hover:text-sidebar-foreground p-4 rounded-lg w-full overflow-hidden shrink-0",
								(contextMenuOpen || isSelected || draggingOver) && "bg-sidebar text-sidebar-foreground",
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
									<Thumbnail
										item={item}
										width={64}
										height={64}
									/>
								)}
							</div>
							<p className="text-ellipsis truncate select-none px-4 text-sm">{item.data.meta?.name ?? item.data.uuid}</p>
						</div>
					) : (
						<div
							ref={contextMenuTriggerRef}
							className={cn(
								"flex w-full flex-row overflow-hidden cursor-pointer",
								!isLast && "border-b",
								from === "select" && selectTypes && !selectTypes.includes(item.type) && "opacity-50 cursor-not-allowed"
							)}
						>
							<div
								className={cn(
									"flex flex-row w-full gap-8 justify-between overflow-hidden px-4 py-2 hover:bg-sidebar hover:text-sidebar-foreground",
									(contextMenuOpen || isSelected || draggingOver) && "bg-sidebar text-sidebar-foreground",
									draggingOver && item.type === "directory"
										? "animate-pulse border-1 border-blue-500 border-l-2 border-l-blue-500 rounded-lg"
										: isSelected
											? "border-1 border-transparent border-l-2 border-l-blue-500"
											: "border-1 border-l-2 border-transparent"
								)}
							>
								<div
									className={cn(
										"flex flex-1 flex-row items-center overflow-hidden gap-4",
										from === "drive" ? "w-[60%]" : "w-[70%]"
									)}
								>
									{from === "select" && (
										<Checkbox
											checked={isSelected}
											onClick={onClick}
											className="cursor-pointer"
										/>
									)}
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
										<Thumbnail
											item={item}
											width={20}
											height={20}
										/>
									)}
									<p className="text-ellipsis truncate select-none text-sm">{item.data.meta?.name ?? item.data.uuid}</p>
								</div>
								<div
									className={cn(
										"flex flex-row items-center justify-between overflow-hidden gap-8",
										from === "drive" ? "w-[40%]" : "w-[30%]"
									)}
								>
									<div className="flex flex-row items-center overflow-hidden w-[25%]">
										<p className="text-ellipsis truncate select-none text-sm">
											{formatBytes(
												item.type === "directory"
													? directorySizeQuery.status === "success"
														? Number(directorySizeQuery.data.size)
														: Number(item.data.size)
													: Number(item.data.size)
											)}
										</p>
									</div>
									<div className="flex flex-1 flex-row items-center overflow-hidden">
										<p className="text-ellipsis truncate select-none text-sm">
											{item.type === "directory"
												? simpleDate(Number(item.data.timestamp))
												: item.data.meta?.modified
													? simpleDate(Number(item.data.meta?.modified))
													: simpleDate(Number(item.data.timestamp))}
										</p>
									</div>
									{from === "drive" && (
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
									)}
								</div>
							</div>
						</div>
					)}
				</MenuWrapper>
			</div>
		)
	}
)

DriveListItem.displayName = "DriveListItem"

export default DriveListItem
