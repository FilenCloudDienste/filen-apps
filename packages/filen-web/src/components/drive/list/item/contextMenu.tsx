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
import type { DriveItem } from "@/queries/useDriveItems.query"
import type { NonRootObject as FilenSdkRsNonRootObject } from "@filen/sdk-rs"
import { useDriveStore } from "@/stores/drive.store"
import serviceWorker from "@/lib/serviceWorker"
import worker from "@/lib/worker"

export const DriveListItemContextMenu = memo(
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	({ children, item, ...props }: { children: React.ReactNode; onOpenChange?: (open: boolean) => void; item: DriveItem }) => {
		const onOpenChange = useCallback(
			(open: boolean) => {
				props.onOpenChange?.(open)
			},
			[props]
		)

		const download = useCallback(() => {
			const itemsToEncode = [
				...useDriveStore.getState().selectedItems.map(i => {
					if (i.type === "directory") {
						return {
							type: "dir",
							uuid: i.data.uuid,
							meta: i.data.meta,
							parent: i.data.parent,
							favorited: i.data.favorited
						} satisfies FilenSdkRsNonRootObject
					}

					return {
						type: "file",
						uuid: i.data.uuid,
						meta: i.data.meta,
						parent: i.data.parent,
						size: i.data.size,
						favorited: i.data.favorited,
						region: i.data.region,
						bucket: i.data.bucket,
						chunks: i.data.chunks
					} satisfies FilenSdkRsNonRootObject
				})
			] satisfies FilenSdkRsNonRootObject[]

			window.open(
				serviceWorker.buildDownloadUrl({
					items: itemsToEncode,
					type: "download"
				})
			)
		}, [])

		return (
			<ContextMenu onOpenChange={onOpenChange}>
				<ContextMenuTrigger asChild={true}>{children}</ContextMenuTrigger>
				<ContextMenuContent>
					<ContextMenuItem
						inset={true}
						onClick={download}
					>
						Download
						<ContextMenuShortcut>⌘[</ContextMenuShortcut>
					</ContextMenuItem>
					<ContextMenuItem
						inset={true}
						onClick={async () => {
							const itemsToEncode = [
								...useDriveStore.getState().selectedItems.map(i => {
									if (i.type === "directory") {
										return {
											type: "dir",
											uuid: i.data.uuid,
											meta: i.data.meta,
											parent: i.data.parent,
											favorited: i.data.favorited
										} satisfies FilenSdkRsNonRootObject
									}

									return {
										type: "file",
										uuid: i.data.uuid,
										meta: i.data.meta,
										parent: i.data.parent,
										size: i.data.size,
										favorited: i.data.favorited,
										region: i.data.region,
										bucket: i.data.bucket,
										chunks: i.data.chunks
									} satisfies FilenSdkRsNonRootObject
								})
							] satisfies FilenSdkRsNonRootObject[]

							console.log(
								await worker.direct.compressItems({
									items: itemsToEncode,
									name: "testcompress.zip",
									parent: await worker.sdk("root"),
									id: "123"
								})
							)
						}}
					>
						Compress
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
