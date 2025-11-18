import { memo, useCallback } from "react"
import ContextMenu, { type ContextMenuAction, type ContextMenuOnPressNativeEvent } from "react-native-context-menu-view"
import { withUniwind } from "uniwind"
import type { StyleProp, ViewStyle, NativeSyntheticEvent } from "react-native"

export type MenuButton = ContextMenuAction & {
	onPress?: (e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => void
}

export type MenuProps = {
	children: React.ReactNode
	type?: "dropdown" | "context"
	className?: string
	style?: StyleProp<ViewStyle>
	buttons?: MenuButton[]
}

export const MenuInner = memo(
	({ buttons, type, ...props }: MenuProps & Omit<React.ComponentProps<typeof ContextMenu>, "actions" | "dropdownMenuMode">) => {
		const onPress = useCallback(
			(e: NativeSyntheticEvent<ContextMenuOnPressNativeEvent>) => {
				const button = buttons?.[e.nativeEvent.index]

				button?.onPress?.(e)
			},
			[buttons]
		)

		if (props.disabled) {
			return props.children
		}

		return (
			<ContextMenu
				dropdownMenuMode={type === "dropdown"}
				onPress={onPress}
				actions={buttons ?? []}
				{...props}
			>
				{props.children}
			</ContextMenu>
		)
	}
)

MenuInner.displayName = "Menu"

export const Menu = withUniwind(MenuInner) as typeof MenuInner

export default Menu
