import { memo } from "react"
import { Sidebar as UiSidebar } from "@/components/ui/sidebar"
import OuterSidebar from "@/components/sidebar/outer"
import InnerSidebar from "@/components/sidebar/inner"

export const Sidebar = memo(() => {
	return (
		<UiSidebar
			collapsible="offcanvas"
			className="overflow-x-hidden *:data-[sidebar=sidebar]:flex-row p-0"
			variant="inset"
		>
			<OuterSidebar />
			<InnerSidebar />
		</UiSidebar>
	)
})

Sidebar.displayName = "Sidebar"

export default Sidebar
