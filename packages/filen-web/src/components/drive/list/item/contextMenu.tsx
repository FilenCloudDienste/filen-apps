import { memo, useCallback } from "react"
import {
	ContextMenu,
	ContextMenuCheckboxItem,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuShortcut,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger
} from "@/components/ui/context-menu"

export const DriveListItemContextMenu = memo(
	({ children, ...props }: { children: React.ReactNode; onOpenChange?: (open: boolean) => void }) => {
		const onOpenChange = useCallback(
			(open: boolean) => {
				props.onOpenChange?.(open)
			},
			[props]
		)

		return (
			<ContextMenu onOpenChange={onOpenChange}>
				<ContextMenuTrigger asChild={true}>{children}</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					<ContextMenuItem
						inset
						onClick={() => {
							alert("Download clicked")
						}}
					>
						Download
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem inset>
						Back
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem
						inset
						disabled
					>
						Forward
						<ContextMenuShortcut>⌘]</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem inset>
						Reload
						<ContextMenuShortcut>⌘R</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuSub>
						<ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
						<ContextMenuSubContent className="w-44">
							<ContextMenuItem>Save Page...</ContextMenuItem>
							<ContextMenuItem>Create Shortcut...</ContextMenuItem>
							<ContextMenuItem>Name Window...</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem>Developer Tools</ContextMenuItem>
							<ContextMenuSeparator />
							<ContextMenuItem>Delete</ContextMenuItem>
						</ContextMenuSubContent>
					</ContextMenuSub>
					<ContextMenuSeparator />
					<ContextMenuCheckboxItem checked>Show Bookmarks</ContextMenuCheckboxItem>
					<ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
					<ContextMenuSeparator />
					<ContextMenuRadioGroup value="pedro">
						<ContextMenuLabel inset>People</ContextMenuLabel>
						<ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
						<ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
					</ContextMenuRadioGroup>
				</ContextMenuContent>
			</ContextMenu>
		)
	}
)

DriveListItemContextMenu.displayName = "DriveListItemContextMenu"

export default DriveListItemContextMenu
