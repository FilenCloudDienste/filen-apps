import { memo } from "react"
import ContextMenu from "react-native-context-menu-view"
import type { MenuProps } from "@/components/ui/menu/types"
import { withUniwind } from "uniwind"

export const MenuInner = memo((props: MenuProps & React.ComponentProps<typeof ContextMenu>) => {
	return <ContextMenu {...props}>{props.children}</ContextMenu>
})

MenuInner.displayName = "Menu"

export const Menu = withUniwind(MenuInner) as typeof MenuInner

export default Menu
