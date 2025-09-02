import { useEffect, useState } from "react"

export function getScrollbarWidth(): number {
	const outer = document.createElement("div")
	const inner = document.createElement("div")

	outer.style.visibility = "hidden"
	outer.style.overflow = "scroll"
	outer.style.width = "100px"
	outer.style.height = "100px"

	inner.style.width = "100%"
	inner.style.height = "100%"

	document.body.appendChild(outer)
	outer.appendChild(inner)

	const scrollbarWidth = outer.offsetWidth - inner.offsetWidth

	document.body.removeChild(outer)

	return scrollbarWidth
}

export function useScrollbarWidth(): number {
	const [scrollbarWidth, setScrollbarWidth] = useState<number>(getScrollbarWidth())

	useEffect(() => {
		const handleResize = () => {
			setScrollbarWidth(getScrollbarWidth())
		}

		window.addEventListener("resize", handleResize)

		return () => {
			window.removeEventListener("resize", handleResize)
		}
	}, [])

	return scrollbarWidth
}

export default useScrollbarWidth
