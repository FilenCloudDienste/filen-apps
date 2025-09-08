import { memo } from "react"
import { PlusIcon } from "lucide-react"
import { SidebarHeader, SidebarInput } from "@/components/ui/sidebar"
import useDriveParent from "@/hooks/useDriveParent"
import cacheMap from "@/lib/cacheMap"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { inputPrompt } from "@/components/prompts/input"
import { selectDriveItemPrompt } from "@/components/prompts/selectDriveItem"

export const InnerSidebarDriveHeader = memo(() => {
	const driveParent = useDriveParent()

	return (
		<SidebarHeader
			className="gap-3.5 p-4"
			data-dragselectallowed={true}
		>
			<div className="flex w-full items-center justify-between gap-4">
				<div className="text-foreground text-base font-medium text-ellipsis truncate">
					{cacheMap.directoryUUIDToName.get(driveParent?.uuid ?? "") ?? "Cloud Drive"}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild={true}>
						<Button
							size="sm"
							variant="secondary"
						>
							<PlusIcon />
							New
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						side="right"
						align="start"
					>
						<DropdownMenuItem
							onClick={() => {
								inputPrompt({
									title: "New directory",
									description: "Directory name",
									cancelText: "Cancel",
									confirmText: "Create",
									inputProps: {
										placeholder: "Directory name",
										value: "New directory"
									},
									onSubmit: async (): Promise<void> => {
										await new Promise(resolve => setTimeout(resolve, 3000))
										throw new Error("Not implemented")
									}
								}).then(res => {
									console.log(res)
								})
							}}
						>
							New directory
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => {
								selectDriveItemPrompt({
									title: "Select parent directory",
									description: "Select the parent directory where the new file will be created",
									confirmText: "Select",
									cancelText: "Cancel",
									types: ["directory", "file"],
									multiple: true
								}).then(res => {
									console.log(res)
								})
							}}
						>
							New text file
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>Upload files</DropdownMenuItem>
						<DropdownMenuItem>Upload directories</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<SidebarInput placeholder="Search..." />
		</SidebarHeader>
	)
})

InnerSidebarDriveHeader.displayName = "InnerSidebarDriveHeader"

export default InnerSidebarDriveHeader
