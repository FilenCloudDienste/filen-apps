import { memo, useMemo, Fragment } from "react"
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
	ContextMenuLabel,
	ContextMenuSub,
	ContextMenuShortcut,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuPortal,
	ContextMenuGroup,
	ContextMenuCheckboxItem,
	ContextMenuSeparator
} from "@/components/ui/context-menu"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
	DropdownMenuGroup,
	DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type MenuItemType =
	| {
			type: "label"
			text: string | React.ReactNode
			className?: string
	  }
	| {
			type: "separator"
			className?: string
	  }
	| {
			type: "item"
			text: string | React.ReactNode
			inset?: boolean
			onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void | Promise<void>
			shortcut?: string
			className?: string
			destructive?: boolean
	  }
	| {
			type: "shortcut"
			text: string
			className?: string
	  }
	| {
			type: "group"
			items: MenuItemType[]
			className?: string
	  }
	| {
			type: "submenu"
			trigger: string | React.ReactNode
			triggerAsChild?: boolean
			triggerInset?: boolean
			content: MenuItemType[] | React.ReactNode
			contentClassName?: string
			triggerClassName?: string
	  }
	| {
			type: "checkbox"
			text: string | React.ReactNode
			checked: boolean
			onCheckedChange: (checked: boolean) => void
			shortcut?: string
			className?: string
			destructive?: boolean
	  }

export const MenuItem = memo(({ item, type }: { item: MenuItemType; type: "context" | "dropdown" }) => {
	const Item = useMemo(() => {
		return type === "context" ? ContextMenuItem : DropdownMenuItem
	}, [type])

	const Shortcut = useMemo(() => {
		return type === "context" ? ContextMenuShortcut : DropdownMenuShortcut
	}, [type])

	const Label = useMemo(() => {
		return type === "context" ? ContextMenuLabel : DropdownMenuLabel
	}, [type])

	const Separator = useMemo(() => {
		return type === "context" ? ContextMenuSeparator : DropdownMenuSeparator
	}, [type])

	const Group = useMemo(() => {
		return type === "context" ? ContextMenuGroup : DropdownMenuGroup
	}, [type])

	const SubMenu = useMemo(() => {
		return type === "context" ? ContextMenuSub : DropdownMenuSub
	}, [type])

	const SubMenuTrigger = useMemo(() => {
		return type === "context" ? ContextMenuSubTrigger : DropdownMenuSubTrigger
	}, [type])

	const SubMenuContent = useMemo(() => {
		return type === "context" ? ContextMenuSubContent : DropdownMenuSubContent
	}, [type])

	const SubMenuPortal = useMemo(() => {
		return type === "context" ? ContextMenuPortal : DropdownMenuPortal
	}, [type])

	const CheckboxItem = useMemo(() => {
		return type === "context" ? ContextMenuCheckboxItem : DropdownMenuCheckboxItem
	}, [type])

	return (
		<Fragment>
			{item.type === "label" && <Label className={item.className}>{item.text}</Label>}
			{item.type === "separator" && <Separator className={item.className} />}
			{item.type === "item" && (
				<Item
					inset={item.inset}
					onClick={item.onClick}
					className={cn(
						"cursor-pointer flex flex-row items-center gap-8",
						item.className,
						item.destructive && "text-destructive hover:text-destructive focus:text-destructive"
					)}
				>
					{item.text}
					{item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
				</Item>
			)}
			{item.type === "shortcut" && <Shortcut className={item.className}>{item.text}</Shortcut>}
			{item.type === "group" && (
				<Group className={item.className}>
					{item.items.map((child, childIndex) => (
						<MenuItem
							key={childIndex}
							item={child}
							type={type}
						/>
					))}
				</Group>
			)}
			{item.type === "submenu" && (
				<SubMenu>
					<SubMenuTrigger
						asChild={item.triggerAsChild}
						inset={item.triggerInset}
						className={cn("cursor-pointer flex flex-row items-center gap-8", item.triggerClassName)}
					>
						{item.trigger}
					</SubMenuTrigger>
					<SubMenuPortal>
						<SubMenuContent className={item.contentClassName}>
							{Array.isArray(item.content)
								? item.content.map((child, childIndex) => (
										<MenuItem
											key={childIndex}
											item={child}
											type={type}
										/>
									))
								: item.content}
						</SubMenuContent>
					</SubMenuPortal>
				</SubMenu>
			)}
			{item.type === "checkbox" && (
				<CheckboxItem
					checked={item.checked}
					onCheckedChange={item.onCheckedChange}
					className={cn(
						"cursor-pointer flex flex-row items-center gap-8",
						item.className,
						item.destructive && "text-destructive hover:text-destructive focus:text-destructive"
					)}
				>
					{item.text}
					{item.shortcut && <Shortcut>{item.shortcut}</Shortcut>}
				</CheckboxItem>
			)}
		</Fragment>
	)
})

MenuItem.displayName = "MenuItem"

export const Menu = memo(
	({
		type,
		onOpenChange,
		open,
		defaultOpen,
		children,
		triggerAsChild,
		items,
		disabled
	}: {
		type: "context" | "dropdown"
		onOpenChange?: (open: boolean) => void
		open?: boolean
		defaultOpen?: boolean
		children: React.ReactNode
		triggerAsChild?: boolean
		items: MenuItemType[]
		disabled?: boolean
	}) => {
		const Parent = useMemo(() => {
			return type === "context" ? ContextMenu : DropdownMenu
		}, [type])

		const Trigger = useMemo(() => {
			return type === "context" ? ContextMenuTrigger : DropdownMenuTrigger
		}, [type])

		const Content = useMemo(() => {
			return type === "context" ? ContextMenuContent : DropdownMenuContent
		}, [type])

		if (disabled || items.length === 0) {
			return <Fragment>{children}</Fragment>
		}

		return (
			<Parent
				onOpenChange={onOpenChange}
				open={open}
				defaultOpen={defaultOpen}
			>
				<Trigger asChild={triggerAsChild}>{children}</Trigger>
				<Content>
					{items.map((item, index) => (
						<MenuItem
							key={index}
							item={item}
							type={type}
						/>
					))}
				</Content>
			</Parent>
		)
	}
)

Menu.displayName = "Menu"

export default Menu
