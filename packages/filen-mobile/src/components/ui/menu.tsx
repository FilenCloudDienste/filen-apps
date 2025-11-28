import { memo, useCallback, useMemo } from "@/lib/memo"
import { withUniwind } from "uniwind"
import { type StyleProp, type ViewStyle, Platform } from "react-native"
import { MenuView, type MenuAction, type NativeActionEvent } from "@react-native-menu/menu"
import {
	ContextMenuView,
	type MenuConfig,
	ContextMenuButton,
	type MenuElementConfig,
	type MenuElementSize,
	type UIMenuOptions,
	type MenuAttributes
	// Ref: https://github.com/dominicstop/react-native-ios-context-menu/issues/129
	// eslint-disable-next-line import/no-unresolved
} from "react-native-ios-context-menu"
import { PressableOpacity } from "@/components/ui/pressables"

export type MenuButton = Omit<MenuAction, "subactions"> & {
	onPress?: () => void
	id: string
	subactions?: MenuButton[]
	state?: "off" | "on" | "mixed"
	loading?: boolean
	iOSSize?: MenuElementSize
	iOSUIMenuOptions?: UIMenuOptions[]
	subTitle?: string
	destructive?: boolean
	hidden?: boolean
	keepOpenOnPress?: boolean
	disabled?: boolean
}

export type MenuProps = {
	children: React.ReactNode
	type?: "dropdown" | "context"
	style?: StyleProp<ViewStyle>
	title?: string
	buttons?: MenuButton[]
	className?: string
	disabled?: boolean
	onPress?: () => void
	onOpenMenu?: () => void
	onCloseMenu?: () => void
	isAnchoredToRight?: boolean
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

export function toIosMenu(
	config: Omit<MenuConfig, "menuItems"> & {
		subactions?: MenuButton[]
	}
): MenuConfig {
	return {
		menuTitle: config.menuTitle ?? "",
		menuPreferredElementSize: config.menuPreferredElementSize,
		menuItems: config.subactions?.map(subaction => {
			if ("subactions" in subaction) {
				return toIosSubMenu(subaction)
			}

			return toIosItem(subaction)
		})
	}
}

export function toIosSubMenu(button: MenuButton): MenuElementConfig {
	if (button.loading) {
		return {
			type: "deferred",
			deferredID: `${button.id}-${Date.now()}`
		}
	}

	return {
		menuOptions: button.iOSUIMenuOptions,
		menuTitle: button.title ?? "",
		menuSubtitle: button.subTitle,
		menuPreferredElementSize: button.iOSSize,
		menuItems: button.subactions?.map(item => {
			if ("subactions" in item) {
				return toIosSubMenu(item)
			}

			return toIosItem(item)
		})
	}
}

export function toIosItem(button: MenuButton): MenuElementConfig {
	if (button.loading) {
		return {
			type: "deferred",
			deferredID: `${button.id}-deferred}`
		}
	}

	const menuAttributes: MenuAttributes[] = []

	if (button.destructive) {
		menuAttributes.push("destructive")
	}

	if (button.disabled) {
		menuAttributes.push("disabled")
	}

	if (button.hidden) {
		menuAttributes.push("hidden")
	}

	if (button.keepOpenOnPress) {
		menuAttributes.push("keepsMenuPresented")
	}

	return {
		actionKey: button.id,
		actionTitle: button.title ?? "",
		actionSubtitle: button.subTitle,
		menuState: button.state,
		menuAttributes,
		discoverabilityTitle: button.subTitle
	}
}

export const MenuInner = memo(
	({ buttons, type, onPress, children, title, disabled, style, className, isAnchoredToRight, onOpenMenu, onCloseMenu }: MenuProps) => {
		const uniqueButtons = useMemo(() => {
			if (!buttons) {
				return []
			}

			if (!checkIfButtonIdsAreUnique(buttons)) {
				throw new Error("Menu button IDs must be unique")
			}

			return buttons
		}, [buttons])

		const onPressAction = useCallback(
			(e: NativeActionEvent) => {
				const button = findButtonById(uniqueButtons, e.nativeEvent.event)

				if (!button) {
					return
				}

				button?.onPress?.()
			},
			[uniqueButtons]
		)

		const onPressMenuItem = useCallback(
			({
				nativeEvent
			}: {
				nativeEvent?: {
					actionKey?: string
					actionTitle?: string
				}
			}) => {
				const button = findButtonById(uniqueButtons, nativeEvent?.actionKey ?? "")

				if (!button) {
					return
				}

				button?.onPress?.()
			},
			[uniqueButtons]
		)

		const menuConfig = useMemo(() => {
			return toIosMenu({
				menuTitle: title ?? "",
				subactions: uniqueButtons
			})
		}, [title, uniqueButtons])

		if (disabled) {
			return children
		}

		if (Platform.OS === "ios") {
			if (type === "dropdown") {
				return (
					<ContextMenuButton
						menuConfig={menuConfig}
						isMenuPrimaryAction={true}
						onPressMenuItem={onPressMenuItem}
						onMenuWillShow={onOpenMenu}
						onMenuWillHide={onCloseMenu}
						style={style}
						className={className}
					>
						{children}
					</ContextMenuButton>
				)
			}

			return (
				<ContextMenuView
					menuConfig={menuConfig}
					onPressMenuItem={onPressMenuItem}
					onMenuWillShow={onOpenMenu}
					onMenuWillHide={onCloseMenu}
					style={style}
					className={className}
				>
					<PressableOpacity
						className="flex-col w-full h-auto"
						onPress={onPress}
					>
						{children}
					</PressableOpacity>
				</ContextMenuView>
			)
		}

		return (
			<MenuView
				shouldOpenOnLongPress={type === "context"}
				actions={uniqueButtons}
				onPressAction={onPressAction}
				style={style}
				isAnchoredToRight={isAnchoredToRight}
				onOpenMenu={onOpenMenu}
				onCloseMenu={onCloseMenu}
			>
				<PressableOpacity
					className="flex-row w-full h-auto"
					onPress={onPress}
				>
					{children}
				</PressableOpacity>
			</MenuView>
		)
	}
)

export const Menu = withUniwind(MenuInner) as typeof MenuInner

export default Menu
