import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useDrivePath from "@/hooks/useDrivePath"
import useDriveItemsQuery from "@/queries/useDriveItems.query"
import type { DriveItem } from "@/types"
import { itemSorter } from "@/lib/sort"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import { Paths } from "expo-file-system"
import cache from "@/lib/cache"
import { useStringifiedClient } from "@/lib/auth"
import Item from "@/components/drive/item"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { memo, useCallback, useMemo } from "@/lib/memo"
import { Platform } from "react-native"

export const Drive = memo(() => {
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

	const keyExtractor = useCallback((item: DriveItem) => {
		return item.data.uuid
	}, [])

	const data = useMemo(() => {
		return driveItemsQuery.data ? itemSorter.sortItems(driveItemsQuery.data, "nameAsc") : []
	}, [driveItemsQuery.data])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await driveItemsQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [driveItemsQuery])

	const headerTitle = useMemo(() => {
		if (stringifiedClient && Paths.basename(drivePath.pathname ?? "") === stringifiedClient.rootUuid) {
			return "tbd"
		}

		return cache.directoryUuidToName.get(Paths.basename(drivePath.pathname ?? "")) ?? "tbd"
	}, [drivePath, stringifiedClient])

	return (
		<Fragment>
			<Header
				title={headerTitle}
				transparent={Platform.OS === "ios"}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-40"
					keyExtractor={keyExtractor}
					data={data}
					renderItem={renderItem}
					onRefresh={onRefresh}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

export default Drive
