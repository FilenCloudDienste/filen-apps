import "@/global.css"

import { memo, useEffect } from "react"
import * as NavigationBar from "expo-navigation-bar"
import { Platform } from "react-native"

export const StyleProvider = memo(({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		if (Platform.OS === "android") {
			console.log("Setting Android navigation bar style to dark")
			Promise.all([NavigationBar.setButtonStyleAsync("light"), NavigationBar.setStyle("dark")]).catch(console.error)
		}
	}, [])

	return children
})

StyleProvider.displayName = "StyleProvider"

export default StyleProvider
