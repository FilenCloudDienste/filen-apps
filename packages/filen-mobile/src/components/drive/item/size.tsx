import { memo } from "@/lib/memo"
import Text from "@/components/ui/text"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import type { DriveItem } from "@/types"
import useDirectorySizeQuery from "@/queries/useDirectorySize.query"

export const Size = memo(({ info }: { info: ListRenderItemInfo<DriveItem> }) => {
	const directorySizeQuery = useDirectorySizeQuery(
		{
			uuid: info.item.data.uuid
		},
		{
			enabled: info.item.type === "directory"
		}
	)

	if (info.item.type === "file" || info.item.type === "sharedFile") {
		return <Text>{Number(info.item.data.size)}</Text>
	}

	if (directorySizeQuery.status !== "success") {
		return null
	}

	return <Text>{Number(directorySizeQuery.data.size)}</Text>
})

export default Size
