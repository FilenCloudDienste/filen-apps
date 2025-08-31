import { memo, useMemo } from "react"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"
import { cn } from "@/lib/utils"
import { IS_DESKTOP } from "@/constants"

export const DriveInfo = memo(() => {
	const selectedItems = useDriveStore(useShallow(state => state.selectedItems))

	const info = useMemo(() => {
		if (selectedItems.length === 0) {
			return null
		}

		return selectedItems.at(0) ?? null
	}, [selectedItems])

	// eslint-disable-next-line no-constant-condition
	if (true) {
		return null
	}

	return (
		<div
			data-slot="sidebar-inset-right-sidebar"
			data-dragselectallowed={true}
			className={cn(
				"w-[calc((var(--sidebar-width)+var(--sidebar-width-icon))/1.5)] flex-col bg-background md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm ml-0! transition-transform animate-in animate-out ease-linear shrink-0 hidden lg:flex",
				IS_DESKTOP
					? "md:peer-data-[variant=inset]:m-6 md:peer-data-[variant=inset]:mr-4 md:peer-data-[variant=inset]:mb-4"
					: "md:peer-data-[variant=inset]:m-4"
			)}
		>
			<div className="p-4 w-full h-full">
				<h2 className="text-lg font-semibold text-ellipsis truncate">{info?.data.meta?.name}</h2>
				<code className="mt-4">{JSON.stringify(info?.data.meta?.name, null, 4)}</code>
			</div>
		</div>
	)
})

DriveInfo.displayName = "DriveInfo"

export default DriveInfo
