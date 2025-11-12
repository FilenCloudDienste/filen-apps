import { memo } from "react"
import Text from "@/components/ui/text"
import type { ListRenderItemInfo } from "react-native"
import type { DriveItem } from "@/queries/useDriveItems.query"
import useDirectorySizeQuery from "@/queries/useDirectorySize.query"

export const Size = memo(({ info }: { info: ListRenderItemInfo<DriveItem> }) => {
	const directorySizeQuery = useDirectorySizeQuery(
		{
			directoryUuid: info.item.data.uuid
		},
		{
			enabled: info.item.type === "directory"
		}
	)

	if (directorySizeQuery.status !== "success") {
		return null
	}

	return <Text>{Number(directorySizeQuery.data.size)}</Text>
})

Size.displayName = "Size"

export default Size
