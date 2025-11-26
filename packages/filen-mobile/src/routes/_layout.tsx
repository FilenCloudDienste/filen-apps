import "react-native-reanimated"
import "@/global"
import "@/queries/onlineStatus"

import StyleProvider from "@/providers/style.provider"
import { useState, useEffect, Fragment } from "react"
import { memo, useCallback } from "@/lib/memo"
import { Stack } from "expo-router"
import { useResolveClassNames, useUniwind } from "uniwind"
import View from "@/components/ui/view"
import setup from "@/lib/setup"
import { run } from "@filen/utils"
import { useIsAuthed } from "@/lib/auth"
import { queryClient } from "@/queries/client"
import { QueryClientProvider } from "@tanstack/react-query"
import * as SplashScreen from "expo-splash-screen"
import { NotifierWrapper } from "react-native-notifier"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { PressablesConfig } from "pressto"
import * as Haptics from "expo-haptics"
import FullScreenLoadingModal from "@/components/ui/fullScreenLoadingModal"
import NotesSync from "@/components/notes/sync"
import ActionSheetProvider from "@/providers/actionSheet.provider"

SplashScreen.setOptions({
	duration: 400,
	fade: true
})

SplashScreen.preventAutoHideAsync().catch(console.error)

export const RootLayout = memo(() => {
	const bgBackground = useResolveClassNames("bg-background")
	const [isSetupDone, setIsSetupDone] = useState<boolean>(false)
	const isAuthed = useIsAuthed()
	const { theme } = useUniwind()

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
		runSetup()
	}, [runSetup])

	return (
		<StyleProvider>
			<StatusBar style={theme === "dark" ? "light" : "dark"} />
			<GestureHandlerRootView
				style={{
					flex: 1,
					backgroundColor: bgBackground.backgroundColor as string
				}}
			>
				<KeyboardProvider>
					<PressablesConfig
						globalHandlers={{
							onPress: () => {
								Haptics.selectionAsync().catch(console.error)
							}
						}}
					>
						<NotifierWrapper useRNScreensOverlay={true}>
							<QueryClientProvider client={queryClient}>
								<ActionSheetProvider>
									<View className="flex-1">
										{isSetupDone && (
											<Fragment>
												<Stack
													initialRouteName={isAuthed ? "tabs" : "auth"}
													screenOptions={{
														headerShown: false,
														contentStyle: {
															backgroundColor: bgBackground.backgroundColor as string
														}
													}}
												/>
												{isAuthed && (
													<Fragment>
														<NotesSync />
													</Fragment>
												)}
											</Fragment>
										)}
										<FullScreenLoadingModal />
									</View>
								</ActionSheetProvider>
							</QueryClientProvider>
						</NotifierWrapper>
					</PressablesConfig>
				</KeyboardProvider>
			</GestureHandlerRootView>
		</StyleProvider>
	)
})

export default RootLayout
