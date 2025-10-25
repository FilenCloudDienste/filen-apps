import { StatusBar } from "expo-status-bar"
import { Stack } from "expo-router"
import { memo } from "react"

export const RootLayout = memo(() => {
	return (
		<>
			<Stack>
				<Stack.Screen name="index" />
			</Stack>
			<StatusBar style="auto" />
		</>
	)
})

RootLayout.displayName = "RootLayout"

export default RootLayout
