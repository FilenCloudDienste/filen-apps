import { memo } from "react"
import type { DriveItem } from "@/queries/useDriveItems.query"
import cacheMap from "@/lib/cacheMap"
import { FileIcon } from "./itemIcons"
import { useQuery } from "@tanstack/react-query"
import worker from "@/lib/worker"

export const Thumbnail = memo(({ item, width, height }: { item: DriveItem; width: number; height: number }) => {
	const query = useQuery({
		queryKey: ["thumbnailObjectUrl", item],
		queryFn: async () => {
			if (item.type === "directory" || !item.data.canMakeThumbnail) {
				return null
			}

			const fromCache = cacheMap.thumbnails.get(item.data.uuid) ?? null

			if (fromCache) {
				return fromCache
			}

			const fileHandle = await worker.direct.generateThumbnail({
				uuid: item.data.uuid,
				meta: item.data.meta,
				parent: item.data.parent,
				size: item.data.size,
				favorited: item.data.favorited,
				region: item.data.region,
				bucket: item.data.bucket,
				chunks: item.data.chunks,
				canMakeThumbnail: item.data.canMakeThumbnail
			})

			const blob = await fileHandle.getFile()

			const urlObject = globalThis.URL.createObjectURL(blob)

			cacheMap.thumbnails.set(item.data.uuid, urlObject)

			return urlObject
		},
		refetchOnMount: "always"
	})

	if (item.type === "directory") {
		return null
	}

	if (query.status !== "success" || !query.data) {
		return (
			<FileIcon
				fileName={item.data.meta?.name ?? item.data.uuid}
				width={width}
				height={height}
				className="shrink-0 object-cover"
			/>
		)
	}

	return (
		<img
			src={query.data}
			className="shrink-0 object-cover rounded-sm"
			draggable={false}
			width={width}
			height={height}
			style={{
				width,
				height
			}}
		/>
	)
})

Thumbnail.displayName = "Thumbnail"

export default Thumbnail
