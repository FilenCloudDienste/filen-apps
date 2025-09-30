import { memo, useCallback, useState } from "react"
import type { NoteTag } from "@filen/sdk-rs"
import MenuComponent from "@/components/menu"
import type { DefaultTags } from ".."
import useMenuItems from "./useMenuItems"

export const Menu = memo(
	({
		tag,
		type,
		children,
		onOpenChange
	}: {
		tag: NoteTag | DefaultTags
		type: React.ComponentPropsWithoutRef<typeof MenuComponent>["type"]
		children: React.ReactNode
		onOpenChange?: (open: boolean) => void
	}) => {
		const [, setOpen] = useState<boolean>(false)

		const menuItems = useMenuItems({
			tag
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
				type={type}
				triggerAsChild={true}
				items={menuItems}
				onOpenChange={onChangeOpen}
			>
				{children}
			</MenuComponent>
		)
	}
)

Menu.displayName = "Menu"

export default Menu
