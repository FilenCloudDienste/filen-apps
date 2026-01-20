import { memo } from "@/lib/memo"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import type { DriveItem } from "@/types"
import { simpleDate } from "@/lib/time"
import isEqual from "react-fast-compare"

export const DateComponent = memo(
	({ info }: { info: ListRenderItemInfo<DriveItem> }) => {
		if (info.item.type === "file" || info.item.type === "sharedFile") {
			if (info.item.data.decryptedMeta?.modified) {
				return simpleDate(Number(info.item.data.decryptedMeta.modified))
			}

			if (info.item.data.decryptedMeta?.created) {
				return simpleDate(Number(info.item.data.decryptedMeta.created))
			}

			if (info.item.type === "file") {
				return simpleDate(Number(info.item.data.timestamp))
			}

			return simpleDate(new Date().getTime())
		}

		if (info.item.data.decryptedMeta?.created) {
			return simpleDate(Number(info.item.data.decryptedMeta.created))
		}

		if (info.item.type === "directory") {
			return simpleDate(Number(info.item.data.timestamp))
		}

		return simpleDate(new Date().getTime())
	},
	(prevProps, nextProps) => {
		return prevProps.info.item.type === nextProps.info.item.type && isEqual(prevProps.info.item.data, nextProps.info.item.data)
	}
)

export default DateComponent
