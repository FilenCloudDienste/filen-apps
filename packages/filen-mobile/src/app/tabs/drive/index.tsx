import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { fastLocaleCompare } from "@filen/utils"
import View from "@/components/ui/view"
import VirtualList from "@/components/ui/virtualList"
import { PressableOpacity } from "@/components/ui/pressables"
import Menu from "@/components/ui/menu"

export const DriveIndex = memo(() => {
	const drivePath = useDrivePath()

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
					keyExtractor={item =>
						item.type === "directory"
							? item.data.uuid
							: item.type === "file"
								? item.data.uuid
								: item.type === "sharedDirectory"
									? item.data.inner.uuid
									: item.data.file.uuid
					}
					data={
						driveItemsQuery.data
							? driveItemsQuery.data.sort((a, b) =>
									fastLocaleCompare(a.data.decryptedMeta?.name ?? "", b.data.decryptedMeta?.name ?? "")
								)
							: []
					}
					renderItem={info => {
						return (
							<View className="border-b border-border flex-row w-full">
								<PressableOpacity
									className="flex-row gap-2 p-2 px-4 w-full h-full"
									onPress={() => console.log("onpress")}
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
										<View className="flex-row w-full h-full bg-transparent">
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
