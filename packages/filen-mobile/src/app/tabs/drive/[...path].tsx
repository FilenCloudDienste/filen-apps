import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { itemSorter } from "@/lib/sort"
import View from "@/components/ui/view"
import VirtualList from "@/components/ui/virtualList"
import { PressableOpacity } from "@/components/ui/pressables"
import Menu from "@/components/ui/menu"
import { FileIcon, DirectoryIcon } from "@/components/itemIcons"
import { useRouter } from "expo-router"
import { Paths } from "expo-file-system"

export const DriveIndex = memo(() => {
	const drivePath = useDrivePath()
	const router = useRouter()

	const driveItemsQuery = useDriveItemsQuery(
		{
			path: drivePath
		},
		{
			enabled: drivePath.type !== null
		}
	)

	return (
		<Fragment>
			<Header title="Drive" />
			<SafeAreaView edges={["left", "right"]}>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-32"
					itemHeight={36}
					keyExtractor={item =>
						item.type === "directory"
							? item.data.uuid
							: item.type === "file"
								? item.data.uuid
								: item.type === "sharedDirectory"
									? item.data.inner.uuid
									: item.data.file.uuid
					}
					data={driveItemsQuery.data ? itemSorter.sortItems(driveItemsQuery.data, "nameAsc") : []}
					renderItem={info => {
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
											<Text>{info.index}</Text>
											<Text>{info.item.data.decryptedMeta?.name}</Text>
										</View>
									</Menu>
								</PressableOpacity>
							</View>
						)
					}}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

DriveIndex.displayName = "DriveIndex"

export default DriveIndex
