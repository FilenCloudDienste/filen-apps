import { memo, useMemo } from "react"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { Virtuoso, VirtuosoGrid } from "react-virtuoso"
import { orderItemsByType } from "@/lib/utils"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuShortcut, ContextMenuTrigger } from "@/components/ui/context-menu"
import useDrivePath from "@/hooks/useDrivePath"
import DriveListItem from "./item"
import useElementDimensions from "@/hooks/useElementDimensions"

export const grid = false

export const DriveList = memo(() => {
	const drivePath = useDrivePath()
	const [ref, { width }] = useElementDimensions<HTMLDivElement>()

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
			ref={ref}
			className="flex flex-1 flex-col px-4"
		>
			<ContextMenu>
				<ContextMenuTrigger asChild={true}>
					{grid ? (
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
							defaultItemHeight={45}
							fixedItemHeight={45}
							skipAnimationFrameInResizeObserver={true}
							itemContent={(index, item) => (
								<DriveListItem
									item={item}
									isLast={index === items.length - 1}
									items={items}
									index={index}
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
