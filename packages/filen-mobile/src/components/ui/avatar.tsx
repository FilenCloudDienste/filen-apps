import Image from "@/components/ui/image"
import { memo, useCallback, useMemo } from "@/lib/memo"
import View from "@/components/ui/view"
import { cn } from "@filen/utils"
import { useState } from "react"
import type { ViewStyle, StyleProp } from "react-native"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"

export const Avatar = memo(
	(props: {
		size?: number
		source?: React.ComponentProps<typeof Image>["source"]
		className?: string
		style?: StyleProp<ViewStyle>
		immediateFallback?: boolean
		group?: number
	}) => {
		const [hasError, setHasError] = useState<boolean>(false)
		const textMutedForeground = useResolveClassNames("text-muted-foreground")

		const size = useMemo(() => props.size ?? 32, [props.size])

		const onError = useCallback(() => {
			setHasError(true)
		}, [])

		const onLoad = useCallback(() => {
			setHasError(false)
		}, [])

		return (
			<View
				className={cn("flex-row overflow-hidden rounded-full bg-background-tertiary items-center justify-center", props.className)}
				style={[
					props.style,
					{
						width: size,
						height: size
					}
				]}
			>
				{props.group ? (
					<Ionicons
						name="people"
						size={size * 0.7}
						color={textMutedForeground.color}
					/>
				) : props.immediateFallback || hasError || !props.source ? (
					<Ionicons
						name="person"
						size={size * 0.7}
						color={textMutedForeground.color}
					/>
				) : (
					<Image
						source={props.source}
						onError={onError}
						onLoad={onLoad}
						style={{
							width: size,
							height: size
						}}
						contentFit="contain"
					/>
				)}
			</View>
		)
	}
)

export default Avatar
