import { memo, useCallback, useRef, useEffect } from "react"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import useElementDimensions from "@/hooks/useElementDimensions"
import usePreviewStore, { type DriveItemFileWithPreviewType } from "@/stores/preview.store"
import { useShallow } from "zustand/shallow"
import PreviewItem from "./item"

export const PreviewList = memo(() => {
	const initialIndex = usePreviewStore(useShallow(state => state.initialIndex))
	const [ref, { width, height }] = useElementDimensions<HTMLDivElement>()
	const virtuosoRef = useRef<VirtuosoHandle>(null)
	const items = usePreviewStore(useShallow(state => state.items))
	const open = usePreviewStore(useShallow(state => state.open))

	const itemContent = useCallback(
		(_: number, item: DriveItemFileWithPreviewType) => {
			return (
				<PreviewItem
					item={item}
					width={width}
					height={height}
				/>
			)
		},
		[width, height]
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
		<div
			ref={ref}
			className="flex flex-1 w-full h-full"
		>
			<Virtuoso
				ref={virtuosoRef}
				width={width}
				height={height}
				style={{
					width,
					height
				}}
				computeItemKey={(_index, item) => item.uuid}
				horizontalDirection={true}
				data={items}
				initialTopMostItemIndex={initialIndex}
				overscan={0}
				increaseViewportBy={0}
				components={{
					Item: props => (
						<div
							{...props}
							style={{
								...props.style,
								width,
								height
							}}
						/>
					),
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
				itemContent={itemContent}
			/>
		</div>
	)
})

PreviewList.displayName = "PreviewList"

export default PreviewList
