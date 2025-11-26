import { memo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"
import { Stack } from "expo-router"
import type { NativeStackHeaderItemProps, NativeStackHeaderItem } from "@react-navigation/native-stack"

export const Header = memo(
	(props: {
		title: string
		right?: (props: NativeStackHeaderItemProps) => React.ReactNode
		rightItems?: (props: NativeStackHeaderItemProps) => NativeStackHeaderItem[]
		left?: (props: NativeStackHeaderItemProps) => React.ReactNode
		leftItems?: (props: NativeStackHeaderItemProps) => NativeStackHeaderItem[]
		shown?: boolean
		largeTitle?: boolean
	}) => {
		const bgBackground = useResolveClassNames("bg-background")
		const textForeground = useResolveClassNames("text-foreground")

		return (
			<Stack.Screen
				options={{
					headerTitle: props.title,
					headerShown: props.shown ?? true,
					headerStyle: {
						backgroundColor: bgBackground.backgroundColor as string
					},
					headerTitleStyle: {
						color: textForeground.color as string
					},
					headerTintColor: textForeground.color as string,
					headerRight: props.rightItems ? undefined : props.right,
					unstable_headerRightItems: props.rightItems,
					headerLargeTitle: props.largeTitle,
					headerLeft: props.leftItems ? undefined : props.left,
					unstable_headerLeftItems: props.leftItems
				}}
			/>
		)
	}
)

export default Header
