import { memo, useCallback, useMemo } from "@/lib/memo"
import { withUniwind, useResolveClassNames } from "uniwind"
import { type StyleProp, type ViewStyle, Platform } from "react-native"
import { MenuView, type NativeActionEvent, type MenuAction } from "@react-native-menu/menu"
import {
	ContextMenu as SwiftUiContextMenu,
	Host as SwiftUiHost,
	Button as SwiftUiButton,
	Text as SwiftUiText,
	// Switch as SwiftUiSwitch,
	Image as SwiftUiImage
} from "@expo/ui/swift-ui"
// import * as swiftUiModifiers from "@expo/ui/swift-ui/modifiers"

export type MenuButton = {
	onPress?: () => void
	id: string
	subButtons?: MenuButton[]
	subButtonsInline?: boolean
	checked?: boolean
	loading?: boolean
	subTitle?: string
	destructive?: boolean
	hidden?: boolean
	keepOpenOnPress?: boolean
	disabled?: boolean
	icon?: Icons
	title?: string
	keepMenuOpenOnPress?: boolean
	titleColor?: string
	iconColor?: string
	testID?: string
}

export type Icons =
	| "heart"
	| "pin"
	| "trash"
	| "edit"
	| "delete"
	| "duplicate"
	| "copy"
	| "export"
	| "archive"
	| "clock"
	| "select"
	| "user"
	| "users"
	| "tag"
	| "restore"
	| "exit"
	| "plus"
	| "plusCircle"
	| "plusSquare"
	| "text"
	| "richtext"
	| "markdown"
	| "code"
	| "checklist"
	| "search"
	| "eye"
	| "list"
	| "grid"

export function iconToSwiftUiIcon(name: Icons, fill?: boolean): React.ComponentPropsWithoutRef<typeof SwiftUiImage>["systemName"] {
	switch (name) {
		case "heart": {
			return fill ? "heart.fill" : "heart"
		}

		case "pin": {
			return fill ? "pin.fill" : "pin"
		}

		case "trash": {
			return fill ? "trash.fill" : "trash"
		}

		case "edit": {
			return fill ? "pencil" : "pencil"
		}

		case "delete": {
			return fill ? "xmark.circle.fill" : "xmark.circle"
		}

		case "duplicate": {
			return fill ? "doc.on.doc.fill" : "doc.on.doc"
		}

		case "copy": {
			return fill ? "doc.on.clipboard.fill" : "doc.on.clipboard"
		}

		case "export": {
			return fill ? "square.and.arrow.up.fill" : "square.and.arrow.up"
		}

		case "archive": {
			return fill ? "archivebox.fill" : "archivebox"
		}

		case "clock": {
			return fill ? "clock.fill" : "clock"
		}

		case "select": {
			return fill ? "checkmark.circle.fill" : "checkmark.circle"
		}

		case "user": {
			return fill ? "person.fill" : "person"
		}

		case "users": {
			return fill ? "person.2.fill" : "person.2"
		}

		case "tag": {
			return fill ? "tag.fill" : "tag"
		}

		case "restore": {
			return fill ? "arrow.uturn.left" : "arrow.uturn.left"
		}

		case "exit": {
			return fill ? "escape" : "escape"
		}

		case "plus": {
			return fill ? "plus" : "plus"
		}

		case "plusCircle": {
			return fill ? "plus.circle.fill" : "plus.circle"
		}

		case "plusSquare": {
			return fill ? "plus.rectangle.fill" : "plus.rectangle"
		}

		case "text": {
			return fill ? "textformat" : "textformat"
		}

		case "richtext": {
			return fill ? "doc.plaintext.fill" : "doc.plaintext"
		}

		case "markdown": {
			return fill ? "arrow.down.doc.fill" : "arrow.down.doc"
		}

		case "code": {
			return fill ? "chevron.left.slash.chevron.right" : "chevron.left.slash.chevron.right"
		}

		case "checklist": {
			return fill ? "checklist.checked" : "checklist"
		}

		case "search": {
			return fill ? "magnifyingglass" : "magnifyingglass"
		}

		case "eye": {
			return fill ? "eye.fill" : "eye"
		}

		case "list": {
			return fill ? "list.bullet.rectangle.fill" : "list.bullet.rectangle"
		}

		case "grid": {
			return fill ? "square.grid.2x2.fill" : "square.grid.2x2"
		}
	}
}

export function findButtonById(buttons: MenuButton[], id: string): MenuButton | null {
	if (!buttons) {
		return null
	}

	for (const button of buttons) {
		if (button.id === id) {
			return button
		}

		if (button.subButtons) {
			const found = findButtonById(button.subButtons, id)

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

			if (button.subButtons) {
				const unique = checkButtons(button.subButtons)

				if (!unique) {
					return false
				}
			}
		}

		return true
	}

	return checkButtons(buttons)
}

export function toAndroidMenuActions(buttons: MenuButton[]): MenuAction[] {
	return buttons.map(button => {
		return {
			subactions: button.subButtons && button.subButtons.length > 0 ? toAndroidMenuActions(button.subButtons) : undefined,
			id: button.id,
			title: button.title ?? "",
			state: button.checked ? "on" : undefined,
			subtitle: button.subTitle,
			titleColor: button.titleColor,
			imageColor: button.iconColor,
			displayInline: button.subButtonsInline,
			attributes: {
				destructive: button.destructive,
				disabled: button.disabled,
				keepsMenuPresented: button.keepMenuOpenOnPress,
				hidden: button.hidden
			}
		} satisfies MenuAction
	})
}

export const ContextMenuItemsIos = memo(({ title, buttons }: { title?: string; buttons: MenuButton[] }) => {
	const textPrimary = useResolveClassNames("text-primary")

	return (
		<SwiftUiContextMenu.Items>
			{title && <SwiftUiText>{title}</SwiftUiText>}
			{buttons.map(button => {
				if (button.hidden) {
					return null
				}

				if (button.subButtons && button.subButtons.length > 0) {
					return (
						<SwiftUiContextMenu
							key={button.id}
							activationMethod="singlePress"
						>
							<ContextMenuItemsIos buttons={button.subButtons} />
							<SwiftUiContextMenu.Trigger>
								<SwiftUiButton
									role={button.destructive ? "destructive" : undefined}
									systemImage={button.icon ? iconToSwiftUiIcon(button.icon) : undefined}
									disabled={button.disabled}
									testID={button.testID}
								>
									{button.title}
								</SwiftUiButton>
							</SwiftUiContextMenu.Trigger>
						</SwiftUiContextMenu>
					)
				}

				// TODO: Add back when updating expo/ui (sdk 55+)
				/*
				if (button.checked) {
					return (
						<SwiftUiSwitch
							key={button.id}
							variant="button"
							label={button.title}
							value={button.checked}
							testID={button.testID}
							modifiers={button.disabled ? [swiftUiModifiers.disabled(button.disabled)] : undefined}
							onValueChange={e => {
								if (e) {
									return
								}

								button.onPress?.()
							}}
							systemImage={button.icon ? iconToSwiftUiIcon(button.icon) : undefined}
						/>
					)
				}

				 if (button.subTitle) {
					return (
						<SwiftUiButton
							key={button.id}
							onPress={button.onPress}
							testID={button.testID}
							role={button.destructive ? "destructive" : undefined}
							disabled={button.disabled}
						>
							{button.icon && <SwiftUiImage systemName={iconToSwiftUiIcon(button.icon)} />}
							<SwiftUiText>{button.title}</SwiftUiText>
							<SwiftUiText>{button.subTitle}</SwiftUiText>
						</SwiftUiButton>
					)
				} */

				return (
					<SwiftUiButton
						key={button.id}
						onPress={button.onPress}
						testID={button.testID}
						role={button.destructive ? "destructive" : undefined}
						systemImage={button.icon ? iconToSwiftUiIcon(button.icon) : undefined}
						color={button.checked ? (textPrimary.color as string) : button.titleColor}
						disabled={button.disabled}
					>
						{button.title}
					</SwiftUiButton>
				)
			})}
		</SwiftUiContextMenu.Items>
	)
})

export const MenuInner = memo(
	({
		buttons,
		type,
		children,
		title,
		disabled,
		style,
		isAnchoredToRight,
		onOpenMenu,
		onCloseMenu,
		testID,
		renderPreview
	}: {
		children: React.ReactNode
		type?: "dropdown" | "context"
		style?: StyleProp<ViewStyle>
		title?: string
		buttons?: MenuButton[]
		className?: string
		disabled?: boolean
		onOpenMenu?: () => void
		onCloseMenu?: () => void
		isAnchoredToRight?: boolean
		testID?: string
		renderPreview?: () => React.ReactNode
	}) => {
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

		if (disabled) {
			return children
		}

		if (Platform.OS === "ios") {
			return (
				<SwiftUiHost
					style={style}
					testID={testID ? `${testID}-host` : undefined}
				>
					<SwiftUiContextMenu
						activationMethod={type === "context" ? "longPress" : "singlePress"}
						testID={testID}
					>
						{renderPreview && <SwiftUiContextMenu.Preview>{renderPreview()}</SwiftUiContextMenu.Preview>}
						<ContextMenuItemsIos
							title={title}
							buttons={uniqueButtons}
						/>
						<SwiftUiContextMenu.Trigger>{children}</SwiftUiContextMenu.Trigger>
					</SwiftUiContextMenu>
				</SwiftUiHost>
			)
		}

		// TODO: Migrate to expo/ui ContextMenu when Android menus are stable and support dropdown/context mode + nesting
		return (
			<MenuView
				shouldOpenOnLongPress={type === "context"}
				actions={toAndroidMenuActions(uniqueButtons)}
				onPressAction={onPressAction}
				style={style}
				isAnchoredToRight={isAnchoredToRight}
				onOpenMenu={onOpenMenu}
				onCloseMenu={onCloseMenu}
				title={title}
				testID={testID}
			>
				{children}
			</MenuView>
		)
	}
)

export const Menu = withUniwind(MenuInner) as typeof MenuInner

export default Menu
