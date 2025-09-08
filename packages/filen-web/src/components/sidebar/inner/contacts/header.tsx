import { memo } from "react"
import { PlusIcon } from "lucide-react"
import { SidebarHeader } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export const InnerSidebarContactsHeader = memo(() => {
	return (
		<SidebarHeader className="gap-3.5 p-4 pb-0">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="text-foreground text-base font-medium text-ellipsis truncate">Contacts</div>
				<Button
					size="sm"
					variant="secondary"
				>
					<PlusIcon />
					Add
				</Button>
			</div>
		</SidebarHeader>
	)
})

InnerSidebarContactsHeader.displayName = "InnerSidebarContactsHeader"

export default InnerSidebarContactsHeader
