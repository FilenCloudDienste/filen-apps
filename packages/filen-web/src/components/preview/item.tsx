import { memo } from "react"
import type { DriveItemFileWithPreviewType } from "@/stores/preview.store"
import serviceWorker from "@/lib/serviceWorker"
import TextPreview from "./text"

export const PreviewItem = memo(({ item, width, height }: { item: DriveItemFileWithPreviewType; width: number; height: number }) => {
	return (
		<div
			style={{
				width,
				height
			}}
		>
			{item.previewType === "image" ? (
				<img
					className="object-contain rounded-b-lg"
					style={{
						width,
						height
					}}
					src={serviceWorker.buildDownloadUrl({
						items: [
							{
								type: "file",
								...item
							}
						],
						type: "stream",
						name: item.meta?.name
					})}
				/>
			) : item.previewType === "video" ? (
				<video
					className="object-contain rounded-b-lg"
					style={{
						width,
						height
					}}
					controls={true}
					autoPlay={true}
					loop={true}
					src={serviceWorker.buildDownloadUrl({
						items: [
							{
								type: "file",
								...item
							}
						],
						type: "stream",
						name: item.meta?.name
					})}
					controlsList="nodownload"
				/>
			) : item.previewType === "pdf" ? (
				<iframe
					src={serviceWorker.buildDownloadUrl({
						items: [
							{
								type: "file",
								...item
							}
						],
						type: "stream",
						name: item.meta?.name
					})}
					title={item.meta?.name ?? "PDF Preview"}
					width={width}
					height={height}
					className="object-contain rounded-b-lg"
					style={{
						width,
						height
					}}
				/>
			) : item.previewType === "text" || item.previewType === "code" || item.previewType === "markdown" ? (
				<div
					className="overflow-hidden rounded-b-lg"
					style={{
						width,
						height
					}}
				>
					<TextPreview
						item={item}
						width={width}
						height={height}
					/>
				</div>
			) : (
				<div>
					Preview {item.meta?.name ?? ""} {item.previewType}
				</div>
			)}
		</div>
	)
})

PreviewItem.displayName = "PreviewItem"

export default PreviewItem
