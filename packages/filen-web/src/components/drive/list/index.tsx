import { memo, useMemo, useCallback } from "react"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { Virtuoso, VirtuosoGrid } from "react-virtuoso"
import { orderItemsByType } from "@/lib/utils"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu"
import useDrivePath from "@/hooks/useDrivePath"
import DriveListItem from "./item"
import useElementDimensions from "@/hooks/useElementDimensions"
import DriveListHeader from "./header"
import useIdb from "@/hooks/useIdb"
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate, useLocation } from "@tanstack/react-router"

export const DriveList = memo(() => {
	const drivePath = useDrivePath()
	const [ref, { width }] = useElementDimensions<HTMLDivElement>()
	const [listViewMode] = useIdb<"list" | "grid">("listViewMode", "list")
	const navigate = useNavigate()
	const location = useLocation()

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

	const navigateTo = useCallback(
		(newPath: string) => {
			navigate({
				to: newPath
			})
		},
		[navigate]
	)

	return (
		<div
			ref={ref}
			className="flex flex-1 flex-col px-4"
		>
			<DriveListHeader />
			<ContextMenu>
				<ContextMenuTrigger asChild={true}>
					{listViewMode === "grid" ? (
						<VirtuosoGrid
							key={drivePath}
							className="w-full h-full flex flex-1 overflow-x-hidden overflow-y-scroll"
							computeItemKey={(_, item) => item.data.uuid}
							totalCount={items.length}
							data={items}
							components={{
								List: ({ style, children, ...props }) => (
									<div
										{...props}
										style={{
											display: "flex",
											flexWrap: "wrap",
											...style
										}}
									>
										{children}
									</div>
								),
								Item: ({ children, ...props }) => (
									<div
										{...props}
										style={{
											width: Math.floor(width / 6) - 8,
											display: "flex",
											flex: "none",
											alignContent: "stretch",
											boxSizing: "border-box"
										}}
									>
										{children}
									</div>
								)
							}}
							itemContent={(index, item) => (
								<DriveListItem
									item={item}
									isLast={index === items.length - 1}
									items={items}
									index={index}
									navigate={navigateTo}
									type="grid"
									path={location.pathname}
									from="drive"
								/>
							)}
						/>
					) : (
						<Virtuoso
							key={drivePath}
							className="w-full h-full flex flex-1 overflow-x-hidden overflow-y-scroll"
							data={items}
							computeItemKey={(_, item) => item.data.uuid}
							totalCount={items.length}
							defaultItemHeight={46}
							fixedItemHeight={46}
							skipAnimationFrameInResizeObserver={true}
							components={{
								EmptyPlaceholder: () => {
									if (driveItemsQuery.status === "success") {
										return (
											<div className="flex flex-1 w-full h-full flex-row items-center justify-center">
												<p>No files found</p>
											</div>
										)
									}

									return (
										<div className="flex flex-1 w-full h-auto flex-col overflow-hidden">
											{Array.from(
												{
													length: Math.ceil(window.innerHeight / 45 / 3)
												},
												(_, i) => (
													<div
														key={i}
														className="flex flex-row items-center gap-4 border-b justify-center h-[45px]"
													>
														<Skeleton className="h-[20px] w-[20px] rounded-full" />
														<Skeleton className="h-[20px] w-full rounded-lg" />
													</div>
												)
											)}
										</div>
									)
								}
							}}
							itemContent={(index, item) => (
								<DriveListItem
									item={item}
									isLast={index === items.length - 1}
									items={items}
									index={index}
									navigate={navigateTo}
									type="list"
									path={location.pathname}
									from="drive"
								/>
							)}
						/>
					)}
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
