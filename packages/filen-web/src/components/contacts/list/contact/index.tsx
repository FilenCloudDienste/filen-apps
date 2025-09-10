import { memo, useState, useCallback, useRef, Fragment } from "react"
import { contactDisplayName, cn } from "@/lib/utils"
import { EllipsisVerticalIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ContactTagged } from "@/queries/useContacts.query"
import Avatar from "@/components/avatar"
import ContactListContactMenu from "./menu"
import contactsService from "@/services/contacts.service"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@/components/ui/checkbox"
import { useShallow } from "zustand/shallow"
import { useSelectContactPromptStore } from "@/components/prompts/selectContact"

export const ContactsListContactMenuWrapper = memo(
	({
		children,
		contact,
		contactType,
		from,
		setContextMenuOpen,
		type
	}: {
		children: React.ReactNode
		contact: ContactTagged
		contactType: "normal" | "blocked"
		from: "contacts" | "select"
		setContextMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
		type: "context" | "dropdown"
	}) => {
		if (from === "select") {
			return <Fragment>{children}</Fragment>
		}

		return (
			<ContactListContactMenu
				contact={contact}
				contactType={contactType}
				type={type}
				onOpenChange={setContextMenuOpen}
			>
				{children}
			</ContactListContactMenu>
		)
	}
)

ContactsListContactMenuWrapper.displayName = "CContactsListContactMenuWrapper"

export const ContactsListContact = memo(
	({ contact, contactType, from }: { contact: ContactTagged; contactType: "normal" | "blocked"; from: "contacts" | "select" }) => {
		const [contextMenuOpen, setContextMenuOpen] = useState<boolean>(false)
		const contextMenuTriggerRef = useRef<HTMLDivElement>(null)
		const { t } = useTranslation()
		const selected = useSelectContactPromptStore(useShallow(state => state.selected.some(c => c.uuid === contact.uuid)))

		const unblock = useCallback(() => {
			contactsService.unblockContact(contact.uuid).catch(console.error)
		}, [contact])

		const openContextMenu = useCallback((e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			if (!contextMenuTriggerRef.current) {
				return
			}

			contextMenuTriggerRef.current.dispatchEvent(
				new MouseEvent("contextmenu", {
					bubbles: true,
					cancelable: true,
					clientX: e.clientX,
					clientY: e.clientY,
					screenX: e.screenX,
					screenY: e.screenY
				})
			)
		}, [])

		const handleSelect = useCallback(() => {
			const multiple = useSelectContactPromptStore.getState().multiple

			useSelectContactPromptStore.getState().setSelected(prev => {
				const exists = prev.some(c => c.uuid === contact.uuid)

				if (multiple) {
					if (exists) {
						return prev.filter(c => c.uuid !== contact.uuid)
					} else {
						return [...prev, contact]
					}
				} else {
					if (exists) {
						return []
					} else {
						return [contact]
					}
				}
			})
		}, [contact])

		return (
			<ContactsListContactMenuWrapper
				contact={contact}
				contactType={contactType}
				from={from}
				setContextMenuOpen={setContextMenuOpen}
				type="context"
			>
				<div
					ref={contextMenuTriggerRef}
					className={cn(from === "select" ? "px-0 cursor-pointer" : "px-4")}
					onClick={from === "select" ? handleSelect : undefined}
				>
					<div
						className={cn(
							"flex flex-row items-center py-2 px-2 gap-8 hover:bg-sidebar hover:text-sidebar-foreground rounded-lg justify-between",
							contextMenuOpen && "bg-sidebar text-sidebar-foreground"
						)}
					>
						<div className="flex flex-row items-center gap-4">
							{from === "select" && (
								<Checkbox
									checked={selected}
									onClick={e => {
										e.preventDefault()
										e.stopPropagation()

										handleSelect()
									}}
									className="cursor-pointer"
								/>
							)}
							<Avatar
								name={contactDisplayName(contact)}
								src={contact.avatar}
								lastActive={contact.type === "contact" ? Number(contact.lastActive) : undefined}
							/>
							<div className="flex flex-col">
								<p className="text-sm text-ellipsis truncate">{contactDisplayName(contact)}</p>
								<p className="text-xs text-muted-foreground text-ellipsis truncate">{contact.email}</p>
							</div>
						</div>
						{from !== "select" && (
							<Fragment>
								{contactType === "normal" ? (
									<Tooltip delayDuration={1000}>
										<TooltipTrigger asChild={true}>
											<Button
												size="icon"
												variant="ghost"
												onClick={openContextMenu}
											>
												<EllipsisVerticalIcon />
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											align="center"
											className="select-none"
										>
											{t("contacts.list.contact.tooltip.actions")}
										</TooltipContent>
									</Tooltip>
								) : (
									<Tooltip delayDuration={1000}>
										<TooltipTrigger asChild={true}>
											<Button
												size="icon"
												variant="default"
												className="rounded-full bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 size-6"
												onClick={unblock}
											>
												<CheckIcon />
											</Button>
										</TooltipTrigger>
										<TooltipContent
											side="top"
											align="center"
											className="select-none"
										>
											{t("contacts.list.contact.tooltip.unblock")}
										</TooltipContent>
									</Tooltip>
								)}
							</Fragment>
						)}
					</div>
				</div>
			</ContactsListContactMenuWrapper>
		)
	}
)

ContactsListContact.displayName = "ContactsListContact"

export default ContactsListContact
