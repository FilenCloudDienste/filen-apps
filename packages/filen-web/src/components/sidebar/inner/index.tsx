import { memo, Fragment } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { useLocation } from "@tanstack/react-router"
import InnerSidebarDriveHeader from "./drive/header"
import InnerSidebarDriveContent from "./drive/content"
import InnerSidebarContactsHeader from "./contacts/header"
import InnerSidebarContactsContent from "./contacts/content"
import InnerSidebarNotesHeader from "./notes/header"
import InnerSidebarNotesContent from "./notes/content"
import { Tabs } from "@/components/ui/tabs"

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
			{pathname.startsWith("/notes") && (
				<Tabs
					defaultValue="account"
					className="w-full overflow-hidden"
				>
					<InnerSidebarNotesHeader />
					<InnerSidebarNotesContent />
				</Tabs>
			)}
		</Sidebar>
	)
})

InnerSidebar.displayName = "InnerSidebar"

export default InnerSidebar
