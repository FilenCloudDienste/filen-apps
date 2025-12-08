import { memo, useMemo } from "@/lib/memo"
import { useResolveClassNames } from "uniwind"
import { Stack } from "expo-router"
import type { NativeStackHeaderItemProps } from "@react-navigation/native-stack"
import type { BlurEffectTypes, SearchBarProps } from "react-native-screens"
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
					"flex-row items-center justify-center gap-4",
					Platform.select({
						ios: liquidGlassAvailable ? "h-9 min-w-9" : "",
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
		rightClassName,
		left,
		leftClassName,
		shown,
		largeTitle,
		backVisible,
		backTitle,
		shadowVisible,
		transparent,
		blurEffect,
		searchBarOptions
	}: {
		title: string
		right?: (props: NativeStackHeaderItemProps) => React.ReactNode
		left?: (props: NativeStackHeaderItemProps) => React.ReactNode
		rightClassName?: string
		leftClassName?: string
		shown?: boolean
		largeTitle?: boolean
		backVisible?: boolean
		backTitle?: string
		shadowVisible?: boolean
		transparent?: boolean
		blurEffect?: BlurEffectTypes
		searchBarOptions?: SearchBarProps
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
					headerLargeTitle: largeTitle,
					headerTitleAlign: largeTitle || !left ? "left" : "center",
					headerStyle: transparent
						? undefined
						: {
								backgroundColor: bgBackground.backgroundColor as string
							},
					headerTitleStyle: {
						color: textForeground.color as string
					},
					headerTintColor: textForeground.color as string,
					headerSearchBarOptions: searchBarOptions,
					headerRight: props => {
						if (!right) {
							return null
						}

						const rightResult = right(props)

						if (!rightResult) {
							return null
						}

						return (
							<HeaderLeftRightWrapper
								isRight={true}
								className={rightClassName}
							>
								{rightResult}
							</HeaderLeftRightWrapper>
						)
					},
					headerLeft: props => {
						if (!left) {
							return null
						}

						const leftResult = left(props)

						if (!leftResult) {
							return null
						}

						return (
							<HeaderLeftRightWrapper
								isLeft={true}
								className={leftClassName}
							>
								{leftResult}
							</HeaderLeftRightWrapper>
						)
					}
				}}
			/>
		)
	}
)

export default Header
