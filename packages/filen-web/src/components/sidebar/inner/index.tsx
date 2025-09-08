import { memo, Fragment } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { useLocation } from "@tanstack/react-router"
import InnerSidebarDriveHeader from "./drive/header"
import InnerSidebarDriveContent from "./drive/content"
import InnerSidebarContactsHeader from "./contacts/header"
import InnerSidebarContactsContent from "./contacts/content"

export const InnerSidebar = memo(() => {
	const { pathname } = useLocation()

	return (
		<Sidebar
			collapsible="none"
			className="hidden flex-1 md:flex overflow-x-hidden"
		>
			{pathname.startsWith("/drive") && (
				<Fragment>
					<InnerSidebarDriveHeader />
					<InnerSidebarDriveContent />
				</Fragment>
			)}
			{pathname.startsWith("/contacts") && (
				<Fragment>
					<InnerSidebarContactsHeader />
					<InnerSidebarContactsContent />
				</Fragment>
			)}
		</Sidebar>
	)
})

InnerSidebar.displayName = "InnerSidebar"

export default InnerSidebar
