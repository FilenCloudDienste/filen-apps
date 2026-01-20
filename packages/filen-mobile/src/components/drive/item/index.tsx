import { memo, useCallback } from "@/lib/memo"
import View from "@/components/ui/view"
import { PressableScale } from "@/components/ui/pressables"
import Menu from "@/components/ui/menu"
import { FileIcon, DirectoryIcon } from "@/components/itemIcons"
import Text from "@/components/ui/text"
import { useRouter } from "expo-router"
import { Paths } from "expo-file-system"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import type { DriveItem } from "@/types"
import type { DrivePath } from "@/hooks/useDrivePath"
import Size from "@/components/drive/item/size"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"
import Date from "@/components/drive/item/date"
import { Platform } from "react-native"

export const Item = memo(({ info, drivePath }: { info: ListRenderItemInfo<DriveItem>; drivePath: DrivePath }) => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")

	const onPress = useCallback(() => {
		if (info.item.type === "directory") {
			router.push(Paths.join("/", "tabs", "drive", drivePath.pathname ?? "", info.item.data.uuid))

			return
		}
	}, [router, info.item, drivePath])

	return (
		<View className="w-full h-auto flex-col">
			<Menu
				className="flex-row w-full h-auto"
				type="context"
				isAnchoredToRight={true}
				buttons={[
					{
						id: "hello",
						title: "Hello World"
					}
				]}
			>
				<PressableScale
					className="w-full h-auto flex-row"
					onPress={onPress}
				>
					<View className="w-full h-auto flex-row pl-4 gap-4">
						<View className="bg-transparent shrink-0 items-center flex-row">
							{info.item.type === "directory" ? (
								<DirectoryIcon
									color={info.item.data.color}
									width={38}
									height={38}
								/>
							) : (
								<FileIcon
									name={info.item.data.decryptedMeta?.name ?? ""}
									width={38}
									height={38}
								/>
							)}
						</View>
						<View className="flex-1 flex-row items-center border-b border-border gap-4 py-3 pr-4">
							<View className="flex-1 flex-col justify-center gap-0.5">
								<Text
									numberOfLines={1}
									ellipsizeMode="middle"
									className="text-foreground"
								>
									{info.item.data.decryptedMeta?.name}
								</Text>
								<Text
									className="text-xs text-muted-foreground"
									numberOfLines={1}
									ellipsizeMode="middle"
								>
									<Date info={info} /> • <Size info={info} />
								</Text>
							</View>
							{Platform.OS === "android" && (
								<View className="flex-row items-center shrink-0">
									<Menu
										type="dropdown"
										isAnchoredToRight={true}
										buttons={[
											{
												id: "hello",
												title: "Hello World"
											}
										]}
									>
										<Ionicons
											name="ellipsis-horizontal"
											size={20}
											color={textForeground.color}
										/>
									</Menu>
								</View>
							)}
						</View>
					</View>
				</PressableScale>
			</Menu>
		</View>
	)
})

export default Item
