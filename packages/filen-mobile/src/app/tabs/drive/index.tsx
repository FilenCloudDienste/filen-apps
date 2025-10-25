import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import { Stack } from "expo-router"
import View from "@/components/ui/view"

export const DriveIndex = memo(() => {
	return (
		<Fragment>
			<Stack.Screen
				options={{
					headerTitle: "Drive",
					headerShown: true,
					headerRight(props) {
						console.log("Drive headerRight props:", props)

						return (
							<View>
								<Text className="text-blue-500">Infos</Text>
							</View>
						)
					}
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<Text>Welcome to the Drive Page!</Text>
			</SafeAreaView>
		</Fragment>
	)
})

DriveIndex.displayName = "DriveIndex"

export default DriveIndex
