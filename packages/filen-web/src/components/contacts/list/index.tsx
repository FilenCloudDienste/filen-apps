import { memo, useMemo, useCallback } from "react"
import useContactsQuery from "@/queries/useContacts.query"
import { contactDisplayName } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import type { Contact as FilenSdkRsContact } from "@filen/sdk-rs"
import Contact from "./contact"
import { Input } from "@/components/ui/input"

export const ContactsList = memo(({ type }: { type?: "online" | "all" | "offline" }) => {
	const contactsQuery = useContactsQuery()

	const contacts = useMemo(() => {
		if (contactsQuery.status !== "success") {
			return []
		}

		const now = Date.now()

		return contactsQuery.data
			.filter(contact => {
				if (type === "online") {
					return contact.lastActive > now - 5 * 60 * 1000
				} else if (type === "offline") {
					return contact.lastActive <= now - 5 * 60 * 1000
				}

				return true
			})
			.sort((a, b) => {
				const nameA = contactDisplayName(a).toLowerCase()
				const nameB = contactDisplayName(b).toLowerCase()

				return nameA.localeCompare(nameB, globalThis.navigator.language, {
					numeric: true
				})
			})
	}, [contactsQuery.data, contactsQuery.status, type])

	const computeItemKey = useCallback((_: number, contact: FilenSdkRsContact) => contact.uuid, [])

	const itemContent = useCallback((_: number, contact: FilenSdkRsContact) => {
		return <Contact contact={contact} />
	}, [])

	return (
		<div className="flex flex-1 h-full flex-col gap-4 w-full lg:w-[75%]">
			<div className="flex flex-row items-center p-4 pb-0 w-full">
				<Input placeholder="Search contacts..." />
			</div>
			<div className="px-4">
				<p className="text-sm text-muted-foreground">All — {contacts.length}</p>
			</div>
			<Virtuoso
				className="h-full w-full flex flex-1 overflow-x-hidden overflow-y-scroll"
				data={contacts}
				computeItemKey={computeItemKey}
				totalCount={contacts.length}
				itemContent={itemContent}
			/>
		</div>
	)
})

ContactsList.displayName = "ContactsList"

export default ContactsList
