import { memo, useState, useCallback } from "react"
import type { Note as NoteT } from "@filen/sdk-rs"
import MenuComponent from "@/components/menu"
import { useMenuItems } from "./useMenuItems"

export const Menu = memo(
	({
		note,
		children,
		onOpenChange,
		type
	}: {
		note: NoteT
		children: React.ReactNode
		onOpenChange?: (open: boolean) => void
		type: React.ComponentPropsWithoutRef<typeof MenuComponent>["type"]
	}) => {
		const [open, setOpen] = useState<boolean>(false)

		const menuItems = useMenuItems({
			note,
			menuOpen: open
		})

		const onChangeOpen = useCallback(
			(isOpen: boolean) => {
				setOpen(isOpen)
				onOpenChange?.(isOpen)
			},
			[onOpenChange]
		)

		return (
			<MenuComponent
				onOpenChange={onChangeOpen}
				triggerAsChild={true}
				type={type}
				items={menuItems}
			>
				{children}
			</MenuComponent>
		)
	}
)

Menu.displayName = "Menu"

export default Menu
