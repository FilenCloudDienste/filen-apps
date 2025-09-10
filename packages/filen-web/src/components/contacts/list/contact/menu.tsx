import { memo, useCallback } from "react"
import Menu from "@/components/menu"
import type { ContactTagged } from "@/queries/useContacts.query"
import contactsService from "@/services/contacts.service"
import { useTranslation } from "react-i18next"

export const ContactListContactMenu = memo(
	({
		children,
		contact,
		contactType,
		type,
		...props
	}: {
		children: React.ReactNode
		onOpenChange?: (open: boolean) => void
		contact: ContactTagged
		contactType: "normal" | "blocked"
		type: "context" | "dropdown"
	}) => {
		const { t } = useTranslation()

		const onOpenChange = useCallback(
			(open: boolean) => {
				props.onOpenChange?.(open)
			},
			[props]
		)

		const block = useCallback(() => {
			contactsService.blockContact(contact.email).catch(console.error)
		}, [contact])

		const remove = useCallback(() => {
			contactsService.deleteContact(contact.uuid).catch(console.error)
		}, [contact])

		const unblock = useCallback(() => {
			contactsService.unblockContact(contact.uuid).catch(console.error)
		}, [contact])

		return (
			<Menu
				onOpenChange={onOpenChange}
				triggerAsChild={true}
				type={type}
				items={
					contactType === "normal"
						? [
								{
									type: "item",
									inset: false,
									onClick: block,
									text: t("contacts.list.contact.menu.block"),
									destructive: true
								},
								{
									type: "item",
									inset: false,
									onClick: remove,
									text: t("contacts.list.contact.menu.remove"),
									destructive: true
								}
							]
						: [
								{
									type: "item",
									inset: false,
									onClick: unblock,
									text: t("contacts.list.contact.menu.unblock"),
									destructive: true
								}
							]
				}
			>
				{children}
			</Menu>
		)
	}
)

ContactListContactMenu.displayName = "ContactListContactMenu"

export default ContactListContactMenu
