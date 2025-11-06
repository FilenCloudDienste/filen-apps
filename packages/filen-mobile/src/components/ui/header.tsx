import { memo } from "react"
import { useResolveClassNames } from "uniwind"
import { Stack, router } from "expo-router"
import Text from "@/components/ui/text"
import { TouchableOpacity } from "react-native"

export const Header = memo((props: { title: string }) => {
	const bgBackground = useResolveClassNames("bg-background")
	const textForeground = useResolveClassNames("text-foreground")

	return (
		<Stack.Screen
			options={{
				headerTitle: props.title,
				headerShown: true,
				headerStyle: {
					backgroundColor: bgBackground.backgroundColor as string
				},
				headerTitleStyle: {
					color: textForeground.color as string
				},
				headerTintColor: textForeground.color as string,
				headerRight() {
					return (
						<TouchableOpacity
							onPress={() => {
								router.push("/search")
							}}
						>
							<Text>btn</Text>
						</TouchableOpacity>
					)
				}
			}}
		/>
	)
})

Header.displayName = "Header"

export default Header
