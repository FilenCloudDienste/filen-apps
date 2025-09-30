import { memo, Fragment } from "react"
import { Sidebar } from "@/components/ui/sidebar"
import { useLocation } from "@tanstack/react-router"
import DriveHeader from "./drive/header"
import DriveContent from "./drive/content"
import ContactsHeader from "./contacts/header"
import ContactsContent from "./contacts/content"
import NotesHeader from "./notes/header"
import NotesContent from "./notes/content"
import { Tabs } from "@/components/ui/tabs"
import useIdb from "@/hooks/useIdb"

export const InnerSidebar = memo(() => {
	const { pathname } = useLocation()
	const [notesSidebarDefaultTab, setNotesSidebarDefaultTab] = useIdb<"all" | "tags">("notesSidebarDefaultTab", "all")

	return (
		<Sidebar
			collapsible="none"
			className="hidden flex-1 md:flex overflow-x-hidden"
		>
			{pathname.startsWith("/drive") && (
				<Fragment>
					<DriveHeader />
					<DriveContent />
				</Fragment>
			)}
			{pathname.startsWith("/contacts") && (
				<Fragment>
					<ContactsHeader />
					<ContactsContent />
				</Fragment>
			)}
			{pathname.startsWith("/notes") && (
				<Tabs
					defaultValue={notesSidebarDefaultTab}
					className="w-full overflow-hidden h-full"
					onValueChange={setNotesSidebarDefaultTab as (value: string) => void}
				>
					<NotesHeader />
					<NotesContent />
				</Tabs>
			)}
		</Sidebar>
	)
})

InnerSidebar.displayName = "InnerSidebar"

export default InnerSidebar
