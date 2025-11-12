import { memo, Fragment, useCallback } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { itemSorter } from "@/lib/sort"
import VirtualList from "@/components/ui/virtualList"
import { Paths } from "expo-file-system"
import cache from "@/lib/cache"
import { useStringifiedClient } from "@/lib/auth"
import Item from "@/components/drive/item"
import type { ListRenderItemInfo } from "react-native"

export const DriveIndex = memo(() => {
	const drivePath = useDrivePath()
	const stringifiedClient = useStringifiedClient()

	const driveItemsQuery = useDriveItemsQuery(
		{
			path: drivePath
		},
		{
			enabled: drivePath.type !== null
		}
	)

	const renderItem = useCallback(
		(info: ListRenderItemInfo<DriveItem>) => {
			return (
				<Item
					info={info}
					drivePath={drivePath}
				/>
			)
		},
		[drivePath]
	)

	return (
		<Fragment>
			<Header
				title={
					stringifiedClient && Paths.basename(drivePath.pathname ?? "") === stringifiedClient.rootUuid
						? "Drive"
						: (cache.directoryUuidToName.get(Paths.basename(drivePath.pathname ?? "")) ?? "Drive")
				}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-40"
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
					renderItem={renderItem}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

DriveIndex.displayName = "DriveIndex"

export default DriveIndex
