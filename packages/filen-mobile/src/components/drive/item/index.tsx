import { memo } from "react"
import View from "@/components/ui/view"
import { PressableOpacity } from "@/components/ui/pressables"
import Menu from "@/components/ui/menu"
import { FileIcon, DirectoryIcon } from "@/components/itemIcons"
import Text from "@/components/ui/text"
import { useRouter } from "expo-router"
import { Paths } from "expo-file-system"
import type { ListRenderItemInfo } from "react-native"
import type { DriveItem } from "@/queries/useDriveItems.query"
import type { DrivePath } from "@/hooks/useDrivePath"
import Size from "@/components/drive/item/size"

export const Item = memo(({ info, drivePath }: { info: ListRenderItemInfo<DriveItem>; drivePath: DrivePath }) => {
	const router = useRouter()

	return (
		<View className="border-b border-border flex-row w-full h-9">
			<PressableOpacity
				className="flex-row gap-2 p-2 px-4 w-full h-full"
				onPress={() => {
					if (info.item.type === "directory") {
						router.push(Paths.join("/", "tabs", "drive", drivePath.pathname ?? "", info.item.data.uuid))
					}
				}}
			>
				<Menu
					className="flex-row w-full h-full"
					type="context"
					onPress={e => {
						console.log(e.nativeEvent)
					}}
					preview={<Text>{info.item.data.decryptedMeta?.name}</Text>}
					actions={[
						{
							title: "Title 1"
						},
						{
							title: "Title 2"
						}
					]}
				>
					<View className="flex-row w-full h-full bg-transparent gap-4 items-center">
						{info.item.type === "directory" ? (
							<DirectoryIcon color={info.item.data.color} />
						) : (
							<FileIcon name={info.item.data.decryptedMeta?.name ?? ""} />
						)}
						<Text>{info.item.data.decryptedMeta?.name}</Text>
						<Size info={info} />
					</View>
				</Menu>
			</PressableOpacity>
		</View>
	)
})

Item.displayName = "Item"

export default Item
