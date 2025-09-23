import { memo, useCallback, useMemo, useState } from "react"
import type { DriveItem } from "@/queries/useDriveItems.query"
import type { NonRootItemTagged as FilenSdkRsNonRootItemTagged } from "@filen/sdk-rs"
import { useDriveStore } from "@/stores/drive.store"
import serviceWorker from "@/lib/serviceWorker"
import worker from "@/lib/worker"
import { useShallow } from "zustand/shallow"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "@tanstack/react-router"
import pathModule from "path"
import Menu from "@/components/menu"
import { HexColorPicker } from "react-colorful"
import { directoryColorToHex } from "@/components/itemIcons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const DriveListItemMenu = memo(
	({
		children,
		item,
		type,
		...props
	}: {
		children: React.ReactNode
		onOpenChange?: (open: boolean) => void
		item: DriveItem
		type: "context" | "dropdown"
	}) => {
		const selectedItems = useDriveStore(useShallow(state => state.selectedItems))
		const { t } = useTranslation()
		const navigate = useNavigate()
		const location = useLocation()
		const [directoryColor, setDirectoryColor] = useState<string>(
			directoryColorToHex(item.type === "directory" ? (item.data.color ?? null) : null)
		)

		const onOpenChange = useCallback(
			(open: boolean) => {
				props.onOpenChange?.(open)
			},
			[props]
		)

		const open = useCallback(() => {
			if (item.type !== "directory") {
				return
			}

			navigate({
				to: pathModule.posix.join(location.pathname, item.data.uuid)
			})
		}, [item.type, item.data.uuid, location.pathname, navigate])

		const selectedItemsAsFilenSdkRsItems = useMemo(() => {
			return [
				...selectedItems.map(i => {
					if (i.type === "directory") {
						return {
							type: "dir",
							uuid: i.data.uuid,
							meta: i.data.meta,
							parent: i.data.parent,
							favorited: i.data.favorited,
							color: i.data.color,
							timestamp: i.data.timestamp
						} satisfies FilenSdkRsNonRootItemTagged
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
						chunks: i.data.chunks,
						canMakeThumbnail: i.data.canMakeThumbnail,
						timestamp: i.data.timestamp
					} satisfies FilenSdkRsNonRootItemTagged
				})
			] satisfies FilenSdkRsNonRootItemTagged[]
		}, [selectedItems])

		const download = useCallback(() => {
			if (selectedItemsAsFilenSdkRsItems.length === 0) {
				return
			}

			window.open(
				serviceWorker.buildDownloadUrl({
					items: selectedItemsAsFilenSdkRsItems,
					type: "download"
				})
			)
		}, [selectedItemsAsFilenSdkRsItems])

		const onColorPickerChange = useCallback((newColor: string) => {
			setDirectoryColor(newColor)
		}, [])

		const onColorInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
			const newColor = e.target.value.trim()

			setDirectoryColor(newColor)
		}, [])

		return (
			<Menu
				onOpenChange={onOpenChange}
				triggerAsChild={true}
				type={type}
				items={[
					{
						type: "item",
						inset: true,
						onClick: open,
						text: t("drive.list.item.contextMenu.open"),
						shortcut: "⌘["
					},
					{
						type: "item",
						inset: true,
						onClick: download,
						text: t("drive.list.item.contextMenu.download"),
						shortcut: "⌘D"
					},
					{
						type: "item",
						inset: true,
						text: t("drive.list.item.contextMenu.compress"),
						onClick: async () => {
							const itemsToEncode = [
								...useDriveStore.getState().selectedItems.map(i => {
									if (i.type === "directory") {
										return {
											type: "dir",
											uuid: i.data.uuid,
											meta: i.data.meta,
											parent: i.data.parent,
											favorited: i.data.favorited,
											color: i.data.color,
											timestamp: i.data.timestamp
										} satisfies FilenSdkRsNonRootItemTagged
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
										chunks: i.data.chunks,
										canMakeThumbnail: i.data.canMakeThumbnail,
										timestamp: i.data.timestamp
									} satisfies FilenSdkRsNonRootItemTagged
								})
							] satisfies FilenSdkRsNonRootItemTagged[]

							console.log(
								await worker.direct.compressItems({
									items: itemsToEncode,
									name: "testcompress.zip",
									parent: await worker.sdk("root"),
									id: "123"
								})
							)
						}
					},
					{
						type: "separator"
					},
					{
						type: "item",
						inset: true,
						onClick: () => {},
						text: t("drive.list.item.contextMenu.publicLink"),
						shortcut: "⌘D"
					},
					{
						type: "item",
						inset: true,
						onClick: () => {},
						text: t("drive.list.item.contextMenu.share"),
						shortcut: "⌘D"
					},
					{
						type: "separator"
					},
					{
						type: "checkbox",
						onCheckedChange: checked => console.log(checked),
						checked: item.data.favorited,
						text: t("drive.list.item.contextMenu.favorited"),
						shortcut: "⌘D"
					},
					{
						type: "submenu",
						trigger: t("drive.list.item.contextMenu.color"),
						triggerInset: true,
						contentClassName: "p-2",
						content: (
							<div className="flex flex-col gap-2">
								<HexColorPicker
									color={directoryColor}
									onChange={onColorPickerChange}
									onClick={e => e.stopPropagation()}
									style={{
										borderRadius: "4px"
									}}
								/>
								<Input
									onChange={onColorInputChange}
									value={directoryColor}
									placeholder="#000000"
									autoCapitalize="none"
									autoComplete="none"
									autoCorrect="none"
									autoFocus={false}
									type="text"
								/>
								<Button size="sm">set</Button>
							</div>
						)
					},
					{
						type: "separator"
					},
					{
						type: "item",
						text: t("drive.list.item.contextMenu.rename"),
						inset: true,
						onClick: () => {}
					},
					{
						type: "submenu",
						trigger: t("drive.list.item.contextMenu.move"),
						triggerInset: true,
						content: [
							{
								type: "item",
								text: t("drive.list.item.contextMenu.selectDestination"),
								onClick: () => {}
							},
							{
								type: "submenu",
								trigger: t("cloudDrive"),
								triggerInset: false,
								content: [
									{
										type: "item",
										text: t("drive.list.item.contextMenu.selectDestination"),
										onClick: () => {}
									}
								]
							}
						]
					},
					{
						type: "separator"
					},
					{
						type: "item",
						text: t("drive.list.item.contextMenu.copyId"),
						inset: true,
						onClick: () => {}
					},
					{
						type: "separator"
					},
					{
						type: "item",
						text: t("drive.list.item.contextMenu.trash"),
						inset: true,
						destructive: true,
						onClick: () => {}
					}
				]}
			>
				{children}
			</Menu>
		)
	}
)

DriveListItemMenu.displayName = "DriveListItemMenu"

export default DriveListItemMenu
