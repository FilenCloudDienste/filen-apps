import useAppStore from "@/stores/useApp.store"
import { memo } from "@/lib/memo"
import { useEffect } from "react"
import { usePathname } from "expo-router"

export const Pathname = memo(() => {
	const pathname = usePathname()

	useEffect(() => {
		useAppStore.getState().setPathname(pathname)
	}, [pathname])

	return null
})

export default Pathname
