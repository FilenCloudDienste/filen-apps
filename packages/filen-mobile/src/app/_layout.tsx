import "react-native-reanimated"
import "@/global.css"

import { memo } from "react"
import { Stack } from "expo-router"

export const RootLayout = memo(() => {
	return (
		<Stack
			screenOptions={{
				headerShown: false
			}}
		/>
	)
})

RootLayout.displayName = "RootLayout"

export default RootLayout
