import { memo, useCallback, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import usePreviewStore from "@/stores/preview.store"
import { useShallow } from "zustand/shallow"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import serviceWorker from "@/lib/serviceWorker"
import { XIcon, EllipsisVerticalIcon } from "lucide-react"
import { Button } from "../ui/button"
import DriveListItemMenu from "../drive/list/item/menu"
import { IS_DESKTOP } from "@/constants"
import { cn } from "@/lib/utils"

export const margin = IS_DESKTOP ? 32 : 32

export const Preview = memo(() => {
	const open = usePreviewStore(useShallow(state => state.open))
	const items = usePreviewStore(useShallow(state => state.items))
	const initialIndex = usePreviewStore(useShallow(state => state.initialIndex))
	const virtuosoRef = useRef<VirtuosoHandle>(null)
	const currentItem = usePreviewStore(useShallow(state => state.items.at(state.currentIndex) ?? null))

	const close = useCallback(() => {
		usePreviewStore.getState().hide()
	}, [])

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				close()
			}
		},
		[close]
	)

	const keyDownListener = useCallback(
		(e: KeyboardEvent) => {
			if (!open) {
				return
			}

			e.preventDefault()
			e.stopPropagation()

			if (e.key === "ArrowLeft") {
				const currentIndex = usePreviewStore.getState().currentIndex
				const previousIndex = currentIndex - 1 < 0 ? 0 : currentIndex - 1

				virtuosoRef?.current?.scrollToIndex({
					align: "center",
					behavior: "smooth",
					index: previousIndex
				})

				usePreviewStore.getState().setCurrentIndex(previousIndex)

				return
			}

			if (e.key === "ArrowRight") {
				const currentIndex = usePreviewStore.getState().currentIndex
				const nextIndex = currentIndex + 1 > items.length - 1 ? items.length - 1 : currentIndex + 1

				virtuosoRef?.current?.scrollToIndex({
					align: "center",
					behavior: "smooth",
					index: nextIndex
				})

				usePreviewStore.getState().setCurrentIndex(nextIndex)

				return
			}
		},
		[open, items]
	)

	useEffect(() => {
		window.addEventListener("keydown", keyDownListener)

		return () => {
			window.removeEventListener("keydown", keyDownListener)
		}
	}, [keyDownListener])

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
		>
			<SheetContent
				side="center"
				className="border-none rounded-lg p-0 flex-col gap-0 z-50"
				hideCloseButton={true}
				overlayClassName={cn("bg-sidebar", IS_DESKTOP ? "m-[6px] rounded-lg" : "m-0")}
				style={{
					height: `calc(100dvh - ${margin}px)`,
					width: `calc(100dvw - ${margin}px)`,
					margin: `${margin / 2}px`
				}}
			>
				<SheetHeader className="flex flex-row items-center w-full px-4 border-b justify-between">
					<div>
						<SheetTitle>{currentItem?.meta?.name ?? "Unknown"}</SheetTitle>
					</div>
					<div className="flex flex-row items-center gap-4">
						{currentItem && (
							<DriveListItemMenu
								item={{
									type: "file",
									data: currentItem
								}}
								type="dropdown"
							>
								<Button
									variant="ghost"
									size="icon"
								>
									<EllipsisVerticalIcon />
								</Button>
							</DriveListItemMenu>
						)}
						<Button
							size="icon"
							variant="ghost"
							onClick={close}
						>
							<XIcon />
						</Button>
					</div>
				</SheetHeader>
				<SheetDescription
					className="flex flex-1 w-full h-full overflow-hidden text-base"
					asChild={true}
				>
					<div className="flex flex-1 w-full h-full">
						<Virtuoso
							ref={virtuosoRef}
							className="flex flex-1 w-full h-full"
							horizontalDirection={true}
							data={items}
							initialTopMostItemIndex={initialIndex}
							overscan={0}
							increaseViewportBy={0}
							components={{
								Scroller: props => (
									<div
										{...props}
										style={{
											...props.style,
											overflow: "hidden"
										}}
									/>
								)
							}}
							itemContent={(_, item) => (
								<div
									className="flex flex-1 h-full items-center justify-center overflow-hidden"
									style={{
										width: `calc(100dvw - ${margin}px)`
									}}
								>
									{item.previewType === "image" ? (
										<img
											className="w-full h-full object-contain"
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
											className="w-full h-full object-contain"
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
											width="100%"
											height="100%"
											className="object-contain"
										/>
									) : (
										<div>
											Preview {item.meta?.name ?? ""} {item.previewType}
										</div>
									)}
								</div>
							)}
						/>
					</div>
				</SheetDescription>
			</SheetContent>
		</Sheet>
	)
})

Preview.displayName = "Preview"

export default Preview
