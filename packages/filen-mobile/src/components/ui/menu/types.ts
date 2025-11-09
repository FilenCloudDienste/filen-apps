import type { StyleProp, ViewStyle } from "react-native"

export type MenuProps = {
	children: React.ReactNode
	type?: "dropdown" | "context"
	className?: string
	style?: StyleProp<ViewStyle>
}
