import { Platform, type StyleProp, type ViewStyle, Button as RNButton } from "react-native"
import { useResolveClassNames } from "uniwind"
import { memo } from "@/lib/memo"

export const Button = memo(
	(props: {
		children: string
		onPress?: () => void
		style?: StyleProp<ViewStyle>
		disabled?: boolean
		color?: string
		testID?: string
	}) => {
		const bgPrimary = useResolveClassNames("bg-primary")

		return Platform.select({
			ios: (
				<RNButton
					title={props.children}
					onPress={props.onPress}
					disabled={props.disabled ?? false}
					color={props.color ?? (bgPrimary.backgroundColor as string)}
					testID={props.testID}
				/>
			),
			default: (
				<RNButton
					title={props.children}
					onPress={props.onPress}
					disabled={props.disabled ?? false}
					color={props.color ?? (bgPrimary.backgroundColor as string)}
					testID={props.testID}
				/>
			)
		})
	}
)

export default Button
