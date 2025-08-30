import { useLocation } from "@tanstack/react-router"
import { useMemo } from "react"

export function useDrivePath() {
	const location = useLocation()

	const state = useMemo(() => {
		if (!location.pathname.startsWith("/drive") || location.pathname === "/drive") {
			return "/"
		}

		return `/${location.pathname.split("/drive/").join("")}`
	}, [location.pathname])

	return state
}

export default useDrivePath
