import { memo } from "react"
import { useDriveStore } from "@/stores/drive.store"
import { useShallow } from "zustand/shallow"
import { cn } from "@/lib/utils"
import useIdb from "@/hooks/useIdb"

export const DriveInfo = memo(({ className }: { className?: string }) => {
	const selectedItems = useDriveStore(useShallow(state => state.selectedItems))
	const [driveInfoVisible] = useIdb<boolean>("driveInfoVisible", false)

	if (!driveInfoVisible) {
		return null
	}

	return (
		<div
			data-slot="sidebar-inset-right-sidebar"
			data-dragselectallowed={true}
			className={cn(
				"w-[calc((var(--sidebar-width)+var(--sidebar-width-icon))/1.5)] flex-col bg-background rounded-xl hidden lg:flex shadow-sm",
				className
			)}
		>
			<div className="p-4 w-full h-full">
				<h2 className="text-lg font-semibold text-ellipsis truncate">info</h2>
				<div>
					{selectedItems.length === 0
						? "none selected"
						: selectedItems.length === 1
							? `${selectedItems[0]!.data.meta?.name} selected`
							: `${selectedItems.length} items selected`}
				</div>
			</div>
		</div>
	)
})

DriveInfo.displayName = "DriveInfo"

export default DriveInfo
