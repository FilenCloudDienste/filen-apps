import { memo, useEffect, useMemo, useState, useRef, useCallback } from "react"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { useDriveStore } from "@/stores/drive.store"
import useDrivePath from "@/hooks/useDrivePath"
import { useLocation } from "@tanstack/react-router"
import { useDialogOrSheetOpen } from "@/hooks/useDialogOrSheetOpen"

export type XY = {
	x: number
	y: number
}

export function rectOverlap(rect1: DOMRect, rect2: DOMRect): boolean {
	return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom)
}

export const DragSelect = memo(() => {
	const [isDragging, setIsDragging] = useState<boolean>(false)
	const [startPos, setStartPos] = useState<XY>({
		x: 0,
		y: 0
	})
	const [endPos, setEndPos] = useState<XY>({
		x: 0,
		y: 0
	})
	const dragAreaRef = useRef<HTMLDivElement>(null)
	const drivePath = useDrivePath()
	const dialogOrSheetOpen = useDialogOrSheetOpen()
	const { pathname } = useLocation()

	const driveItemsQuery = useDriveItemsQuery(
		{
			path: drivePath
		},
		{
			enabled: false
		}
	)

	const items = useMemo(() => {
		if (driveItemsQuery.status !== "success") {
			return []
		}

		return driveItemsQuery.data
	}, [driveItemsQuery])

	const show = useMemo(() => {
		return (
			!dialogOrSheetOpen &&
			pathname.startsWith("/drive") &&
			items.length > 0 &&
			isDragging &&
			startPos.x !== 0 &&
			startPos.y !== 0 &&
			endPos.x !== 0 &&
			endPos.y !== 0
		)
	}, [isDragging, startPos, endPos, items.length, pathname, dialogOrSheetOpen])

	const selectionBoxStyle = useMemo(() => {
		return {
			position: "absolute",
			left: show ? `${Math.min(startPos.x, endPos.x)}px` : 0,
			top: show ? `${Math.min(startPos.y, endPos.y)}px` : 0,
			width: show ? `${Math.abs(startPos.x - endPos.x)}px` : 0,
			height: show ? `${Math.abs(startPos.y - endPos.y)}px` : 0,
			backgroundColor: "rgba(0, 120, 255, 0.1)",
			border: "1px solid rgba(0, 120, 255, 0.7)",
			zIndex: show ? 999999999 : 0,
			display: show ? "flex" : "none"
		} satisfies React.CSSProperties
	}, [startPos, endPos, show])

	const targetRects = useCallback(() => {
		if (!show) {
			return {}
		}

		const rects: Record<
			string,
			{
				element: HTMLDivElement
				rect: DOMRect
			}
		> = {}

		const targets = document.getElementsByClassName("dragselect-collision-check")
		const targetsArray = Array.from(targets)

		for (const target of targetsArray) {
			try {
				const uuid = target.getAttribute("data-uuid")

				if (uuid) {
					const targetRect = (target as HTMLDivElement).getBoundingClientRect()

					rects[uuid] = {
						element: target as HTMLDivElement,
						rect: targetRect
					}
				}
			} catch (e) {
				console.error(e)
			}
		}

		return rects
	}, [show])

	const getSelectionRect = useCallback(() => {
		if (!dragAreaRef.current) {
			return new DOMRect(0, 0, 0, 0)
		}

		return dragAreaRef.current.getBoundingClientRect()
	}, [])

	const checkCollision = useCallback(() => {
		if (items.length === 0) {
			return
		}

		const selectionRect = getSelectionRect()
		const collisions: string[] = []
		const targets = targetRects()

		for (const uuid in targets) {
			const rect = targets[uuid]

			if (rect && rectOverlap(selectionRect, rect.rect)) {
				collisions.push(uuid)
			}
		}

		useDriveStore.getState().setSelectedItems([...items.filter(i => collisions.includes(i.data.uuid))])
	}, [getSelectionRect, targetRects, items])

	const mouseMoveListener = useCallback(
		(e: MouseEvent) => {
			const { clientX, clientY } = e

			if (!isDragging || startPos.x === clientX || startPos.y === clientY) {
				return
			}

			setEndPos({
				x: clientX,
				y: clientY
			})

			checkCollision()
		},
		[isDragging, startPos, checkCollision]
	)

	const mouseDownListener = useCallback((e: MouseEvent) => {
		if (e.button !== 0) {
			return
		}

		const { clientX, clientY } = e
		const target = e.target as HTMLDivElement

		if (!target || !target.dataset || !(target.dataset.dragselectallowed || target.dataset["viewportType"] === "element")) {
			return
		}

		e.preventDefault()
		e.stopPropagation()

		setStartPos({
			x: clientX,
			y: clientY
		})

		setIsDragging(true)

		useDriveStore.getState().setSelectedItems([])
	}, [])

	const mouseUpListener = useCallback(() => {
		setIsDragging(false)

		setStartPos({
			x: 0,
			y: 0
		})

		setEndPos({
			x: 0,
			y: 0
		})
	}, [])

	useEffect(() => {
		document.addEventListener("mousedown", mouseDownListener)
		document.addEventListener("mousemove", mouseMoveListener)
		document.addEventListener("mouseup", mouseUpListener)

		return () => {
			document.removeEventListener("mousemove", mouseMoveListener)
			document.removeEventListener("mousedown", mouseDownListener)
			document.removeEventListener("mouseup", mouseUpListener)
		}
	}, [mouseDownListener, mouseMoveListener, mouseUpListener])

	if (!show) {
		return null
	}

	return (
		<div
			ref={dragAreaRef}
			style={selectionBoxStyle}
		/>
	)
})

DragSelect.displayName = "DragSelect"

export default DragSelect
