import { memo, useCallback, useMemo } from "@/lib/memo"
import { withUniwind } from "uniwind"
import type { StyleProp, ViewStyle } from "react-native"
import { MenuView, type MenuAction, type NativeActionEvent } from "@react-native-menu/menu"

export type MenuButton = Omit<MenuAction, "subactions"> & {
	onPress?: () => void
	id: string
	subactions?: MenuButton[]
	state?: "off" | "on" | "mixed"
}

export type MenuProps = {
	children: React.ReactNode
	type?: "dropdown" | "context"
	style?: StyleProp<ViewStyle>
	buttons?: MenuButton[]
	className?: string
	disabled?: boolean
}

export function findButtonById(buttons: MenuButton[], id: string): MenuButton | null {
	if (!buttons) {
		return null
	}

	for (const button of buttons) {
		if (button.id === id) {
			return button
		}

		if (button.subactions) {
			const found = findButtonById(button.subactions, id)

			if (found) {
				return found
			}
		}
	}

	return null
}

export function checkIfButtonIdsAreUnique(buttons: MenuButton[]): boolean {
	const ids = new Set<string>()

	function checkButtons(buttonsToCheck: MenuButton[]): boolean {
		for (const button of buttonsToCheck) {
			if (ids.has(button.id)) {
				return false
			}

			ids.add(button.id)

			if (button.subactions) {
				const unique = checkButtons(button.subactions)

				if (!unique) {
					return false
				}
			}
		}

		return true
	}

	return checkButtons(buttons)
}

export const MenuInner = memo(
	({ buttons, type, ...props }: MenuProps & Omit<React.ComponentProps<typeof MenuView>, "actions" | "dropdownMenuMode">) => {
		const onPressAction = useCallback(
			(e: NativeActionEvent) => {
				const button = findButtonById(buttons ?? [], e.nativeEvent.event)

				if (!button) {
					return
				}

				button?.onPress?.()
			},
			[buttons]
		)

		const uniqueButtons = useMemo(() => {
			if (!buttons) {
				return []
			}

			if (!checkIfButtonIdsAreUnique(buttons)) {
				throw new Error("Menu button IDs must be unique")
			}

			return buttons
		}, [buttons])

		if (props.disabled) {
			return props.children
		}

		return (
			<MenuView
				shouldOpenOnLongPress={type === "context"}
				actions={uniqueButtons}
				onPressAction={onPressAction}
				{...props}
			>
				{props.children}
			</MenuView>
		)
	}
)

export const Menu = withUniwind(MenuInner) as typeof MenuInner

export default Menu
