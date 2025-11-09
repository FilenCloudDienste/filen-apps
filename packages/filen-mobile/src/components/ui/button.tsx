import { Button as JetpackComposeButton } from "@expo/ui/jetpack-compose"
import { Button as SwiftUiButton } from "@expo/ui/swift-ui"
import { memo } from "react"
import { Platform, type StyleProp, type ViewStyle } from "react-native"
import { useResolveClassNames } from "uniwind"

export const Button = memo(
	(props: {
		children: string
		onPress?: () => void
		style?: StyleProp<ViewStyle>
		disabled?: boolean
		color?: string
		testID?: string
		variant?: {
			ios?: React.ComponentProps<typeof SwiftUiButton>["variant"]
			android?: React.ComponentProps<typeof JetpackComposeButton>["variant"]
		}
		role?: {
			ios?: React.ComponentProps<typeof SwiftUiButton>["role"]
			android?: never
		}
	}) => {
		const bgPrimary = useResolveClassNames("bg-primary")

		return Platform.select({
			ios: (
				<SwiftUiButton
					onPress={props.onPress}
					disabled={props.disabled ?? false}
					color={props.color ?? (bgPrimary.backgroundColor as string)}
					testID={props.testID}
					variant={props.variant?.ios}
					role={props.role?.ios}
				>
					{props.children}
				</SwiftUiButton>
			),
			default: (
				<JetpackComposeButton
					onPress={props.onPress}
					style={props.style}
					disabled={props.disabled ?? false}
					color={props.color ?? (bgPrimary.backgroundColor as string)}
					variant={props.variant?.android}
				>
					{props.children}
				</JetpackComposeButton>
			)
		})
	}
)

Button.displayName = "Button"

export default Button
