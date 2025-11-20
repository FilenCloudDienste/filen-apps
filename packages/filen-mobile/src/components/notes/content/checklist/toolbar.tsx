import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { BlurView, KeyboardStickyView } from "@/components/ui/view"
import { useKeyboardState, KeyboardController } from "react-native-keyboard-controller"
import { useUniwind, useResolveClassNames } from "uniwind"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { PressableOpacity } from "@/components/ui/pressables"
import alerts from "@/lib/alerts"
import { memo, useCallback } from "@/lib/memo"

export const Toolbar = memo(() => {
	const keyboardState = useKeyboardState()
	const { theme } = useUniwind()
	const textPrimary = useResolveClassNames("text-primary")

	const onPress = useCallback(() => {
		if (!keyboardState.isVisible) {
			return
		}

		KeyboardController.dismiss().catch(err => {
			console.error(err)
			alerts.error(err)
		})
	}, [keyboardState.isVisible])

	const insets = useSafeAreaInsets()

	if (!keyboardState.isVisible) {
		return null
	}

	return (
		<KeyboardStickyView>
			<AnimatedView
				entering={FadeIn}
				exiting={FadeOut}
				className="absolute z-50"
				style={{
					bottom: 16,
					right: 16 + insets.right
				}}
			>
				<BlurView
					intensity={100}
					experimentalBlurMethod="dimezisBlurView"
					tint={theme === "dark" ? "dark" : "light"}
					className="flex-row items-center justify-center rounded-full overflow-hidden border border-border size-9"
				>
					<PressableOpacity
						rippleColor="transparent"
						onPress={onPress}
						hitSlop={15}
					>
						<FontAwesome6
							name="check"
							size={18}
							color={textPrimary.color}
						/>
					</PressableOpacity>
				</BlurView>
			</AnimatedView>
		</KeyboardStickyView>
	)
})

export default Toolbar
