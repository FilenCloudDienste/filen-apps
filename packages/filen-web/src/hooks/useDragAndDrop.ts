import { useCallback } from "react"

export function useDragAndDrop(params?: {
	start?: (event: React.DragEvent) => void
	over?: (event: React.DragEvent) => void
	leave?: (event: React.DragEvent) => void
	drop?: (event: React.DragEvent) => void
}) {
	const onDragStart = useCallback(
		(event: React.DragEvent) => {
			params?.start?.(event)
		},
		[params]
	)

	const onDragOver = useCallback(
		(event: React.DragEvent) => {
			params?.over?.(event)
		},
		[params]
	)

	const onDragLeave = useCallback(
		(event: React.DragEvent) => {
			params?.leave?.(event)
		},
		[params]
	)

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			params?.drop?.(event)
		},
		[params]
	)

	return {
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop
	}
}

export default useDragAndDrop
