import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import { FlatList } from "react-native"

export const DriveIndex = memo(() => {
	const drivePath = useDrivePath()

	const driveItemsQuery = useDriveItemsQuery({
		path: drivePath
	})

	console.log("Drive Items:", driveItemsQuery.data?.length ?? 0)

	return (
		<Fragment>
			<Header title="Drive" />
			<SafeAreaView edges={["left", "right"]}>
				<FlatList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					data={driveItemsQuery.data ?? []}
					renderItem={info => {
						return <Text>{info.item.data.decryptedMeta?.name}</Text>
					}}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

DriveIndex.displayName = "DriveIndex"

export default DriveIndex
