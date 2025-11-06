import { Button as JetpackComposeButton } from "@expo/ui/jetpack-compose"
import { Button as SwiftUiButton } from "@expo/ui/swift-ui"
import { memo } from "react"
import { Platform, type StyleProp, type ViewStyle } from "react-native"

export const Button = memo(
	(props: { children: string; onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; color?: string }) => {
		return Platform.select({
			ios: (
				<SwiftUiButton
					onPress={props.onPress}
					disabled={props.disabled ?? false}
				>
					{props.children}
				</SwiftUiButton>
			),
			default: (
				<JetpackComposeButton
					onPress={props.onPress}
					style={props.style}
					disabled={props.disabled ?? false}
				>
					{props.children}
				</JetpackComposeButton>
			)
		})
	}
)

Button.displayName = "Button"

export default Button
