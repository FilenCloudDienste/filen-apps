import { memo } from "react"
import type { DriveItem } from "@/queries/useDriveItems.query"

export const Thumbnail = memo(({ item }: { item: DriveItem }) => {
	console.log(item)

	return <div className="thumbnail">{/* Thumbnail content goes here */}</div>
})

Thumbnail.displayName = "Thumbnail"

export default Thumbnail
