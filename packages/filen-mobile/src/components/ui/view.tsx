import { NativeView } from "react-native-boost/runtime"
import { withUniwind } from "uniwind"
import type { ViewProps, View as RNView } from "react-native"
import { memo } from "react"
import { cn } from "@filen/utils"
import {
	KeyboardAvoidingView as RNKeyboardControllerKeyboardAvoidingView,
	KeyboardAwareScrollView as RNKeyboardControllerKeyboardAwareScrollView
} from "react-native-keyboard-controller"

export const UniwindView = memo(withUniwind(NativeView) as React.FC<ViewProps>)

export const View = memo((props: ViewProps & React.RefAttributes<RNView>) => {
	return (
		<UniwindView
			{...props}
			className={cn("bg-background", props.className)}
		/>
	)
})

View.displayName = "View"

export const UniwindKeyboardAvoidingView = memo(
	withUniwind(RNKeyboardControllerKeyboardAvoidingView) as React.FC<React.ComponentProps<typeof RNKeyboardControllerKeyboardAvoidingView>>
)

export const KeyboardAvoidingView = memo(
	(props: React.ComponentProps<typeof RNKeyboardControllerKeyboardAvoidingView> & React.RefAttributes<RNView>) => {
		return (
			<UniwindKeyboardAvoidingView
				{...props}
				className={cn("bg-background", props.className)}
			/>
		)
	}
)

KeyboardAvoidingView.displayName = "KeyboardAvoidingView"

export const UniwindKeyboardAwareScrollView = memo(
	withUniwind(RNKeyboardControllerKeyboardAwareScrollView) as React.FC<
		React.ComponentProps<typeof RNKeyboardControllerKeyboardAwareScrollView>
	>
)

export const KeyboardAwareScrollView = memo(
	(props: React.ComponentProps<typeof RNKeyboardControllerKeyboardAwareScrollView> & React.RefAttributes<RNView>) => {
		return (
			<UniwindKeyboardAwareScrollView
				{...props}
				className={cn("bg-background", props.className)}
			/>
		)
	}
)

KeyboardAwareScrollView.displayName = "KeyboardAwareScrollView"

export default View
