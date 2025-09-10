import { memo, useMemo } from "react"
import { SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { WifiIcon, Contact2Icon, WifiOffIcon, InboxIcon, SendIcon, LockIcon } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"
import pathModule from "path"
import useContactRequestsQuery from "@/queries/useContactRequests.query"
import useContactsQuery from "@/queries/useContacts.query"
import { ONLINE_TIMEOUT } from "@/constants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"

export const InnerSidebarContactsContent = memo(() => {
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const contactRequestsQuery = useContactRequestsQuery({
		enabled: false
	})

	const contactsQuery = useContactsQuery({
		type: "normal"
	})

	const blockedContactsQuery = useContactsQuery({
		type: "blocked"
	})

	const { incomingRequestsCount, outgoingRequestsCount } = useMemo(() => {
		if (contactRequestsQuery.status !== "success") {
			return {
				incomingRequestsCount: 0,
				outgoingRequestsCount: 0
			}
		}

		return {
			incomingRequestsCount: contactRequestsQuery.data.incoming.length,
			outgoingRequestsCount: contactRequestsQuery.data.outgoing.length
		}
	}, [contactRequestsQuery.data, contactRequestsQuery.status])

	const contactsCount = useMemo(() => {
		if (contactsQuery.status !== "success") {
			return 0
		}

		return contactsQuery.data.length
	}, [contactsQuery.data, contactsQuery.status])

	const blockedContactsCount = useMemo(() => {
		if (blockedContactsQuery.status !== "success") {
			return 0
		}

		return blockedContactsQuery.data.length
	}, [blockedContactsQuery.data, blockedContactsQuery.status])

	const onlineContactsCount = useMemo(() => {
		if (contactsQuery.status !== "success") {
			return 0
		}

		const now = Date.now()

		return contactsQuery.data.filter(contact => {
			if (contact.type !== "contact") {
				return false
			}

			return contact.lastActive > now - ONLINE_TIMEOUT
		}).length
	}, [contactsQuery.data, contactsQuery.status])

	const offlineContactsCount = useMemo(() => {
		if (contactsQuery.status !== "success") {
			return 0
		}

		const now = Date.now()

		return contactsQuery.data.filter(contact => {
			if (contact.type !== "contact") {
				return false
			}

			return contact.lastActive <= now - ONLINE_TIMEOUT
		}).length
	}, [contactsQuery.data, contactsQuery.status])

	const activeLink = useMemo(() => {
		return pathModule.posix.basename(pathname)
	}, [pathname])

	return (
		<SidebarContent className="overflow-x-hidden overflow-y-auto px-2">
			<SidebarGroup className="overflow-x-hidden shrink-0">
				<SidebarGroupContent>
					<SidebarMenu>
						{[
							{
								title: t("contacts.list.online"),
								link: "/contacts/online",
								icon: WifiIcon,
								badge: onlineContactsCount
							},
							{
								title: t("contacts.list.all"),
								link: "/contacts/all",
								icon: Contact2Icon,
								badge: contactsCount
							},
							{
								title: t("contacts.list.offline"),
								link: "/contacts/offline",
								icon: WifiOffIcon,
								badge: offlineContactsCount
							},
							{
								title: t("contacts.list.requests"),
								link: "/contacts/requests",
								icon: InboxIcon,
								badge: incomingRequestsCount
							},
							{
								title: t("contacts.list.pending"),
								link: "/contacts/pending",
								icon: SendIcon,
								badge: outgoingRequestsCount
							},
							{
								title: t("contacts.list.blocked"),
								link: "/contacts/blocked",
								icon: LockIcon,
								badge: blockedContactsCount
							}
						].map(item => (
							<SidebarMenuItem key={item.link}>
								<Link to={item.link}>
									<SidebarMenuButton
										isActive={activeLink === pathModule.posix.basename(item.link)}
										className="cursor-pointer"
									>
										<item.icon />
										{item.title}
										<Badge
											className={cn(
												"ml-auto size-4.5 rounded-full px-1 font-mono tabular-nums text-xs flex items-center justify-center",
												item.link === "/contacts/online" && item.badge > 0 && "bg-green-500 text-white"
											)}
											variant={
												item.link === "/contacts/online" && item.badge > 0
													? "secondary"
													: item.link === "/contacts/requests" && item.badge > 0
														? "destructive"
														: item.badge > 0
															? "default"
															: "outline"
											}
										>
											{item.badge > 9 ? "9+" : item.badge}
										</Badge>
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
