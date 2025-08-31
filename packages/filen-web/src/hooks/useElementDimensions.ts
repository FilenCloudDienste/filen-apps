import { useState, useEffect, useRef, type RefObject } from "react"

export type Dimensions = {
	width: number
	height: number
}

export function useElementDimensions<T extends HTMLElement = HTMLDivElement>(): [RefObject<T | null>, Dimensions] {
	const ref = useRef<T>(null)
	const [dimensions, setDimensions] = useState<Dimensions>({
		width: 0,
		height: 0
	})

	useEffect(() => {
		const element = ref.current

		if (!element) {
			return
		}

		const resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect

				setDimensions({
					width,
					height
				})
			}
		})

		resizeObserver.observe(element)

		const { width, height } = element.getBoundingClientRect()

		setDimensions({
			width,
			height
		})

		return () => {
			resizeObserver.disconnect()
		}
	}, [])

	return [ref, dimensions]
}

export default useElementDimensions
