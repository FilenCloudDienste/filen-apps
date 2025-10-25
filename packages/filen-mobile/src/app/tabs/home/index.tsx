import View from "@/components/ui/view"
import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import { Stack, router } from "expo-router"
import { TouchableOpacity } from "react-native"
import { useResolveClassNames } from "uniwind"

export const Index = memo(() => {
	const headerStyle = useResolveClassNames("bg-blue-500")

	return (
		<Fragment>
			<Stack.Screen
				options={{
					headerTitle: "Home",
					headerShown: true,
					headerStyle: {
						backgroundColor: headerStyle.backgroundColor as string
					},
					headerRight() {
						return (
							<TouchableOpacity onPress={() => router.push("/search")}>
								<Text className="text-blue-500">search</Text>
							</TouchableOpacity>
						)
					}
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<View>
					<Text>Welcome to the Index Page!</Text>
				</View>
			</SafeAreaView>
		</Fragment>
	)
})

Index.displayName = "Index"

export default Index
