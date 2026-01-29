import { memo, useMemo } from "@/lib/memo"
import MenuComponent, { type MenuButton } from "@/components/ui/menu"
import type { DriveItem } from "@/types"
import { router } from "expo-router"
import drive from "@/lib/drive"
import alerts from "@/lib/alerts"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import prompts from "@/lib/prompts"
import { run } from "@filen/utils"
import { SharingRole_Tags } from "@filen/sdk-rs"
import * as FileSystem from "expo-file-system"
import transfers from "@/lib/transfers"
import { randomUUID } from "expo-crypto"
import * as MediaLibrary from "expo-media-library"

export type DriveItemMenuOrigin = "drive" | "preview" | "trash" | "sharedIn" | "sharedOut" | "favorites" | "recents" | "links"

export function createMenuButtons({ item, origin }: { item: DriveItem; origin: DriveItemMenuOrigin }): MenuButton[] {
	const menuButtons: MenuButton[] = []

	if (
		(item.type === "directory" || item.type === "sharedDirectory") &&
		(origin === "drive" || origin === "sharedIn" || origin === "sharedOut" || origin === "favorites" || origin === "links")
	) {
		menuButtons.push({
			id: "open",
			title: "tbd_open",
			onPress: () => {
				router.push({
					pathname:
						item.type === "directory"
							? "/tabs/drive/[uuid]"
							: item.data.sharingRole.tag === SharingRole_Tags.Receiver
								? "/drive/sharedIn/[uuid]"
								: "/drive/sharedOut/[uuid]",
					params: {
						uuid: item.data.uuid
					}
				})
			}
		})
	}

	const downloadSubButtons: MenuButton[] = []

	if (item.type === "file" || item.type === "directory" || item.type === "sharedFile" || item.type === "sharedDirectory") {
		downloadSubButtons.push({
			id: "downloadToDevice",
			title: "tbd_download_to_device",
			onPress: async () => {
				const result = await run(async () => {
					const destination =
						item.type === "file" || item.type === "sharedFile"
							? new FileSystem.File(
									FileSystem.Paths.join(FileSystem.Paths.document, "Downloads", item.data.decryptedMeta?.name ?? "file")
								)
							: new FileSystem.Directory(
									FileSystem.Paths.join(
										FileSystem.Paths.document,
										"Downloads",
										item.data.decryptedMeta?.name ?? "directory"
									)
								)

					if (!destination.parentDirectory.exists) {
						destination.parentDirectory.create({
							intermediates: true,
							idempotent: true
						})
					}

					if (destination.exists) {
						destination.delete()
					}

					return await transfers.download({
						item,
						itemUuid: item.data.uuid,
						destination
					})
				})

				if (!result.success) {
					console.error(result.error)
					alerts.error(result.error)

					return
				}
			}
		})

		downloadSubButtons.push({
			id: "makeAvailableOffline",
			title: "tbd_make_available_offline",
			onPress: () => {
				// TODO
			}
		})
	}

	// TODO: Check if file is an image or video before showing "Save to Photos" option
	if (item.type === "file" || item.type === "sharedFile") {
		downloadSubButtons.push({
			id: "saveToPhotos",
			title: "tbd_save_to_photos",
			onPress: async () => {
				const result = await runWithLoading(async defer => {
					const destination = new FileSystem.File(
						FileSystem.Paths.join(FileSystem.Paths.cache, randomUUID(), item.data.decryptedMeta?.name ?? "file")
					)

					defer(() => {
						if (destination.parentDirectory.exists) {
							destination.parentDirectory.delete()
						}
					})

					if (!destination.parentDirectory.exists) {
						destination.parentDirectory.create({
							intermediates: true,
							idempotent: true
						})
					}

					if (destination.exists) {
						destination.delete()
					}

					await transfers.download({
						item,
						itemUuid: item.data.uuid,
						destination
					})

					console.log(destination)

					// TODO: Add NSPhotoLibraryAddUsageDescription to Info.plist and ask for permissions on both iOS and Android
					await MediaLibrary.saveToLibraryAsync(destination.uri)
				})

				if (!result.success) {
					console.error(result.error)
					alerts.error(result.error)

					return
				}
			}
		})
	}

	if (downloadSubButtons.length > 0) {
		menuButtons.push({
			id: "download",
			title: "tbd_download",
			icon: "archive",
			subButtons: downloadSubButtons
		})
	}

	if (item.type === "file" || item.type === "directory") {
		menuButtons.push({
			id: "share",
			title: "tbd_share",
			subButtons: [
				{
					id: "sharePublicLink",
					title: "tbd_share_public_link",
					onPress: () => {
						// TODO
					}
				},
				{
					id: "shareFilenUser",
					title: "tbd_share_filen_user",
					onPress: () => {
						// TODO
					}
				}
			]
		})
	}

	if (item.type === "file" || item.type === "directory") {
		menuButtons.push({
			id: "favorite",
			title: item.data.favorited ? "tbd_unfavorite" : "tbd_favorite",
			icon: "heart",
			checked: item.data.favorited,
			onPress: async () => {
				const result = await runWithLoading(async () => {
					return await drive.favorite({
						item,
						favorited: !item.data.favorited
					})
				})

				if (!result.success) {
					console.error(result.error)
					alerts.error(result.error)

					return
				}
			}
		})
	}

	if (item.type === "directory" || item.type === "sharedDirectory") {
		menuButtons.push({
			id: "info",
			title: "tbd_info",
			onPress: () => {
				// TODO
			}
		})
	}

	if (item.type === "directory") {
		menuButtons.push({
			id: "color",
			title: "tbd_color",
			onPress: () => {
				// TODO
			}
		})
	}

	if (item.type === "file" || item.type === "directory") {
		menuButtons.push({
			id: "rename",
			title: "tbd_rename",
			icon: "edit",
			onPress: async () => {
				const promptResult = await run(async () => {
					return await prompts.input({
						title: "tbd_rename_item",
						message: "tbd_enter_new_name",
						defaultValue: item.data.decryptedMeta?.name ?? "",
						cancelText: "tbd_cancel",
						okText: "tbd_rename"
					})
				})

				if (!promptResult.success) {
					console.error(promptResult.error)
					alerts.error(promptResult.error)

					return
				}

				if (promptResult.data.cancelled || promptResult.data.type !== "string") {
					return
				}

				const newName = promptResult.data.value.trim()

				if (newName.length === 0) {
					return
				}

				const result = await runWithLoading(async () => {
					await drive.rename({
						item,
						newName
					})
				})

				if (!result.success) {
					console.error(result.error)
					alerts.error(result.error)

					return
				}
			}
		})
	}

	if ((item.type === "file" || item.type === "directory") && origin !== "trash" && origin !== "sharedIn") {
		menuButtons.push({
			id: "trash",
			title: "tbd_trash",
			icon: "trash",
			destructive: true,
			onPress: async () => {
				const promptResult = await run(async () => {
					return await prompts.alert({
						title: "tbd_trash_item",
						message: "tbd_confirm_trash",
						cancelText: "tbd_cancel",
						okText: "tbd_trash"
					})
				})

				if (!promptResult.success) {
					console.error(promptResult.error)
					alerts.error(promptResult.error)

					return
				}

				if (promptResult.data.cancelled) {
					return
				}

				const result = await runWithLoading(async () => {
					await drive.trash({
						item
					})
				})

				if (!result.success) {
					console.error(result.error)
					alerts.error(result.error)

					return
				}
			}
		})
	}

	return menuButtons
}

const Menu = memo(
	({
		item,
		children,
		origin,
		type,
		className,
		isAnchoredToRight
	}: {
		item: DriveItem
		children: React.ReactNode
		origin: DriveItemMenuOrigin
		type: React.ComponentPropsWithoutRef<typeof MenuComponent>["type"]
		className?: string
		isAnchoredToRight?: boolean
	}) => {
		const menuButtons = useMemo(() => {
			return createMenuButtons({
				item,
				origin
			})
		}, [origin, item])

		return (
			<MenuComponent
				className={className}
				type={type}
				isAnchoredToRight={isAnchoredToRight}
				buttons={menuButtons}
				title={item.data.decryptedMeta?.name}
			>
				{children}
			</MenuComponent>
		)
	}
)

export default Menu
