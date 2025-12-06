import { memo, useMemo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"
import { Stack } from "expo-router"
import type { NativeStackHeaderItemProps } from "@react-navigation/native-stack"
import type { BlurEffectTypes } from "react-native-screens"
import { isLiquidGlassAvailable } from "@/components/ui/view"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { cn } from "@filen/utils"
import { Platform } from "react-native"

export const HeaderLeftRightWrapper = memo(
	({ children, className, isLeft, isRight }: { children: React.ReactNode; className?: string; isLeft?: boolean; isRight?: boolean }) => {
		const liquidGlassAvailable = useMemo(() => isLiquidGlassAvailable(), [])

		return (
			<AnimatedView
				className={cn(
					"flex-row items-center justify-center",
					Platform.select({
						ios: liquidGlassAvailable ? "size-9" : "",
						default: ""
					}),
					isLeft && (Platform.OS === "android" || !liquidGlassAvailable) ? "pr-4" : "",
					isRight && (Platform.OS === "android" || !liquidGlassAvailable) ? "pl-4" : "",
					className
				)}
				entering={FadeIn}
				exiting={FadeOut}
			>
				{children}
			</AnimatedView>
		)
	}
)

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
					headerRight: props => {
						if (!right) {
							return null
						}

						const rightResult = right(props)

						if (!rightResult) {
							return null
						}

						return <HeaderLeftRightWrapper isRight={true}>{rightResult}</HeaderLeftRightWrapper>
					},
					headerLargeTitle: largeTitle,
					headerLeft: props => {
						if (!left) {
							return null
						}

						const leftResult = left(props)

						if (!leftResult) {
							return null
						}

						return <HeaderLeftRightWrapper isLeft={true}>{leftResult}</HeaderLeftRightWrapper>
					}
				}}
			/>
		)
	}
)

export default Header
