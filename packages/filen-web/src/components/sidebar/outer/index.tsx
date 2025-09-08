import { memo } from "react"
import { Folder, NotebookIcon, Contact2Icon, MessageCircleIcon, ImagesIcon, HardDriveIcon, FolderSyncIcon } from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar
} from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import { IS_DESKTOP } from "@/constants"
import User from "./user"

export const OuterSidebar = memo(() => {
	const { setOpen } = useSidebar()
	const location = useLocation()

	return (
		<Sidebar
			collapsible="none"
			className="w-[calc(var(--sidebar-width-icon)+1px)]! overflow-x-hidden p-2 border-r"
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem className="z-[10000]">
						<SidebarMenuButton
							size="lg"
							asChild={true}
							className="md:h-8 md:p-0"
						>
							<Link to="/drive">
								<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg p-[6px]">
									<img src="/img/light_logo.svg" />
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent data-dragselectallowed={true}>
				<SidebarGroup>
					<SidebarGroupContent className="px-1.5 md:px-0">
						<SidebarMenu>
							{[
								{
									title: "Drive",
									url: "/drive",
									icon: Folder
								},
								{
									title: "Photos",
									url: "/photos",
									icon: ImagesIcon
								},
								{
									title: "Notes",
									url: "/notes",
									icon: NotebookIcon
								},
								{
									title: "Chats",
									url: "/chats",
									icon: MessageCircleIcon
								},
								{
									title: "Contacts",
									url: "/contacts",
									icon: Contact2Icon
								},
								...(IS_DESKTOP
									? [
											{
												title: "Syncs",
												url: "/syncs",
												icon: FolderSyncIcon
											},
											{
												title: "Mounts",
												url: "/mounts",
												icon: HardDriveIcon
											}
										]
									: [])
							].map(item => (
								<SidebarMenuItem key={item.title}>
									<Link
										to={item.url}
										onClick={() => {
											setOpen(true)
										}}
									>
										<SidebarMenuButton
											tooltip={{
												children: item.title,
												hidden: false
											}}
											isActive={location.pathname.includes(item.url)}
											className="px-2.5 md:px-2 cursor-pointer"
										>
											<item.icon />
											<span>{item.title}</span>
										</SidebarMenuButton>
									</Link>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<User
					user={{
						name: "testnet",
						email: "testnet@example.com",
						avatar: ""
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	)
})

OuterSidebar.displayName = "OuterSidebar"

export default OuterSidebar
