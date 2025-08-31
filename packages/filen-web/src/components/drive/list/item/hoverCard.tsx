import { memo } from "react"
import type { DriveItem } from "@/queries/useDriveItems.query"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"

export const DriveListItemHoverCard = memo(({ item, children }: { item: DriveItem; children: React.ReactNode }) => {
	const draggingItems = useDriveStore(useShallow(state => state.draggingItems))

	if (draggingItems.length > 0) {
		return children
	}

	return (
		<HoverCard openDelay={1000}>
			<HoverCardTrigger asChild={true}>{children}</HoverCardTrigger>
			<HoverCardContent
				side="top"
				align="start"
			>
				{item.data.meta?.name ?? item.data.uuid}
			</HoverCardContent>
		</HoverCard>
	)
})

DriveListItemHoverCard.displayName = "DriveListItemHoverCard"

export default DriveListItemHoverCard
