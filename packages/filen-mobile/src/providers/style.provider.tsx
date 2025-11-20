import "@/global.css"

import { useEffect } from "react"
import * as NavigationBar from "expo-navigation-bar"
import { Platform } from "react-native"
import { memo } from "@/lib/memo"

export const StyleProvider = memo(({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		if (Platform.OS === "android") {
			Promise.all([NavigationBar.setButtonStyleAsync("light"), NavigationBar.setStyle("dark")]).catch(console.error)
		}
	}, [])

	return children
})

export default StyleProvider
