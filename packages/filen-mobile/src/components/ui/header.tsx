import { memo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"
import { Stack } from "expo-router"
import type { NativeStackHeaderItemProps } from "@react-navigation/native-stack"
import type { BlurEffectTypes } from "react-native-screens"
import { isLiquidGlassAvailable } from "@/components/ui/view"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { cn } from "@filen/utils"
import { Platform } from "react-native"

export const HeaderLeftRightWrapper = memo(({ children }: { children: React.ReactNode }) => {
	return (
		<AnimatedView
			className={cn(
				"flex-row items-center justify-center",
				Platform.select({
					ios: isLiquidGlassAvailable() ? "px-1.5" : "",
					default: ""
				})
			)}
			entering={FadeIn}
			exiting={FadeOut}
		>
			{children}
		</AnimatedView>
	)
})

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
		transparent,
		blurEffect
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
		blurEffect?: BlurEffectTypes
	}) => {
		const bgBackground = useResolveClassNames("bg-background")
		const textForeground = useResolveClassNames("text-foreground")

		return (
			<Stack.Screen
				options={{
					headerTitle: title,
					headerShown: shown ?? true,
					headerShadowVisible: transparent ? true : shadowVisible,
					headerBlurEffect: !isLiquidGlassAvailable() ? blurEffect : undefined,
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
