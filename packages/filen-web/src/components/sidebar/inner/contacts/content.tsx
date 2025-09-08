import { memo, useMemo } from "react"
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { WifiIcon, Contact2Icon, WifiOffIcon, InboxIcon, SendIcon, LockIcon } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"
import pathModule from "path"

export const InnerSidebarContactsContent = memo(() => {
	const { pathname } = useLocation()

	const active = useMemo(() => {
		return pathModule.posix.basename(pathname)
	}, [pathname])

	return (
		<SidebarContent className="overflow-x-hidden overflow-y-auto px-2">
			<SidebarGroup className="overflow-x-hidden shrink-0">
				<SidebarGroupContent>
					<SidebarMenu>
						{[
							{
								title: "Online",
								link: "/contacts/online",
								icon: WifiIcon
							},
							{
								title: "All",
								link: "/contacts/all",
								icon: Contact2Icon
							},
							{
								title: "Offline",
								link: "/contacts/offline",
								icon: WifiOffIcon
							},
							{
								title: "Requests",
								link: "/contacts/requests",
								icon: InboxIcon
							},
							{
								title: "Pending",
								link: "/contacts/pending",
								icon: SendIcon
							},
							{
								title: "Blocked",
								link: "/contacts/blocked",
								icon: LockIcon
							}
						].map(item => (
							<SidebarMenuItem key={item.link}>
								<Link to={item.link}>
									<SidebarMenuButton
										isActive={active === pathModule.posix.basename(item.link)}
										className="cursor-pointer"
									>
										<item.icon />
										{item.title}
									</SidebarMenuButton>
								</Link>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
	)
})

InnerSidebarContactsContent.displayName = "InnerSidebarContactsContent"

export default InnerSidebarContactsContent
