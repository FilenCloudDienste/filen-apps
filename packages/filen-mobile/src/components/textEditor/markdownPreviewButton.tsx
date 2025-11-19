import { memo, useMemo, useCallback } from "react"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { BlurView } from "@/components/ui/view"
import { useKeyboardState } from "react-native-keyboard-controller"
import { useUniwind, useResolveClassNames } from "uniwind"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useSecureStore } from "@/lib/secureStore"
import { PressableScale } from "@/components/ui/pressables"
import { useShallow } from "zustand/shallow"
import useTextEditorStore from "@/stores/useTextEditor.store"

export const MarkdownPreviewButton = memo(({ id }: { id: string }) => {
	const keyboardState = useKeyboardState()
	const { theme } = useUniwind()
	const textForeground = useResolveClassNames("text-foreground")
	const insets = useSafeAreaInsets()
	const [textEditorMarkdownPreviewActive, setTextEditorMarkdownPreviewActive] = useSecureStore<Record<string, boolean>>(
		"textEditorMarkdownPreviewActive",
		{}
	)
	const textEditorReady = useTextEditorStore(useShallow(state => state.ready))

	const active = useMemo(() => {
		return textEditorMarkdownPreviewActive[id] ?? false
	}, [id, textEditorMarkdownPreviewActive])

	const onPress = useCallback(() => {
		if (!id) {
			return
		}

		setTextEditorMarkdownPreviewActive(prev => ({
			...prev,
			[id]: !prev[id]
		}))
	}, [id, setTextEditorMarkdownPreviewActive])

	if (keyboardState.isVisible || !textEditorReady) {
		return null
	}

	return (
		<AnimatedView
			entering={FadeIn}
			exiting={FadeOut}
			className="absolute"
			style={{
				bottom: 16 + insets.bottom,
				right: 16 + insets.right
			}}
		>
			<PressableScale
				rippleColor="transparent"
				onPress={onPress}
			>
				<BlurView
					intensity={100}
					experimentalBlurMethod="dimezisBlurView"
					tint={theme === "dark" ? "dark" : "light"}
					className="flex-row items-center justify-center rounded-full overflow-hidden border border-border size-12"
				>
					<FontAwesome6
						name={active ? "eye-slash" : "eye"}
						size={18}
						color={textForeground.color}
					/>
				</BlurView>
			</PressableScale>
		</AnimatedView>
	)
})

MarkdownPreviewButton.displayName = "MarkdownPreviewButton"

export default MarkdownPreviewButton
