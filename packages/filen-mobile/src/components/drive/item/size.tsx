import { memo } from "@/lib/memo"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import type { DriveItem } from "@/types"
import useDirectorySizeQuery from "@/queries/useDirectorySize.query"
import { formatBytes } from "@filen/utils"

export const Size = memo(
	({ info }: { info: ListRenderItemInfo<DriveItem> }) => {
		const directorySizeQuery = useDirectorySizeQuery(
			{
				uuid: info.item.data.uuid
			},
			{
				enabled: info.item.type === "directory"
			}
		)

		if (info.item.type === "file" || info.item.type === "sharedFile") {
			return formatBytes(Number(info.item.data.size))
		}

		if (directorySizeQuery.status !== "success") {
			return null
		}

		return formatBytes(Number(directorySizeQuery.data.size))
	},
	(prevProps, nextProps) => {
		return prevProps.info.item.data.uuid === nextProps.info.item.data.uuid && prevProps.info.item.type === nextProps.info.item.type
	}
)

export default Size
