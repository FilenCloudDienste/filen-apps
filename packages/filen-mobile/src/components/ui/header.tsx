import { memo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"
import { Stack } from "expo-router"
import type { NativeStackHeaderItemProps } from "@react-navigation/native-stack"

export const Header = memo(
	({
		title,
		right,
		left,
		shown,
		largeTitle,
		backVisible,
		backTitle,
		shadowVisible,
		transparent
	}: {
		title: string
		right?: (props: NativeStackHeaderItemProps) => React.ReactNode
		left?: (props: NativeStackHeaderItemProps) => React.ReactNode
		shown?: boolean
		largeTitle?: boolean
		backVisible?: boolean
		backTitle?: string
		shadowVisible?: boolean
		transparent?: boolean
	}) => {
		const bgBackground = useResolveClassNames("bg-background")
		const textForeground = useResolveClassNames("text-foreground")

		return (
			<Stack.Screen
				options={{
					headerTitle: title,
					headerShown: shown ?? true,
					headerShadowVisible: transparent ? true : shadowVisible,
					headerBackVisible: backVisible,
					headerTransparent: transparent,
					headerBackTitle: backTitle,
					headerStyle: transparent
						? undefined
						: {
								backgroundColor: bgBackground.backgroundColor as string
							},
					headerTitleStyle: {
						color: textForeground.color as string
					},
					headerTintColor: textForeground.color as string,
					headerRight: right,
					headerLargeTitle: largeTitle,
					headerLeft: left
				}}
			/>
		)
	}
)

export default Header
