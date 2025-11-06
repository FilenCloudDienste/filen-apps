import "react-native-reanimated"
import "@/global.css"
import "@/global"

import { memo, useState, useEffect, useCallback } from "react"
import { Stack } from "expo-router"
import { useResolveClassNames } from "uniwind"
import View from "@/components/ui/view"
import setup from "@/lib/setup"
import { run } from "@filen/utils"
import Text from "@/components/ui/text"
import { useIsAuthed } from "@/lib/auth"
import { queryClient } from "@/queries/client"
import { QueryClientProvider } from "@tanstack/react-query"
import * as SplashScreen from "expo-splash-screen"

SplashScreen.setOptions({
	duration: 400,
	fade: true
})

SplashScreen.preventAutoHideAsync().catch(console.error)

export const RootLayout = memo(() => {
	const bgBackground = useResolveClassNames("bg-background")
	const [isSetupDone, setIsSetupDone] = useState<boolean>(false)
	const isAuthed = useIsAuthed()

	const runSetup = useCallback(async () => {
		const result = await run(async () => {
			setIsSetupDone(false)

			return await setup.setup()
		})

		if (!result.success) {
			console.error(result.error)

			setIsSetupDone(false)

			return
		}

		console.log("Setup complete, isAuthed:", result.data.isAuthed)

		setIsSetupDone(true)

		SplashScreen.hideAsync().catch(console.error)
	}, [])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		runSetup()
	}, [runSetup])

	return (
		<QueryClientProvider client={queryClient}>
			<View className="flex-1">
				{!isSetupDone ? (
					<Text>Setting up...</Text>
				) : (
					<Stack
						initialRouteName={isAuthed ? "tabs" : "auth"}
						screenOptions={{
							headerShown: false,
							contentStyle: {
								backgroundColor: bgBackground.backgroundColor as string
							}
						}}
					/>
				)}
			</View>
		</QueryClientProvider>
	)
})

RootLayout.displayName = "RootLayout"

export default RootLayout
