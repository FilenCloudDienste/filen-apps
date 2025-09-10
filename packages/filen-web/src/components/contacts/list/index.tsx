import { memo, useMemo, useCallback, useState } from "react"
import useContactsQuery, { type ContactTagged } from "@/queries/useContacts.query"
import { contactDisplayName, cn } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import ContactsListContact from "./contact"
import { Input } from "@/components/ui/input"
import { ONLINE_TIMEOUT } from "@/constants"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"

export const ContactsList = memo(({ type, from }: { type: "online" | "all" | "offline" | "blocked"; from: "contacts" | "select" }) => {
	const [search, setSearch] = useState<string>("")
	const { t } = useTranslation()

	const contactsQuery = useContactsQuery({
		type: type === "blocked" ? "blocked" : "normal"
	})

	const contacts = useMemo(() => {
		if (contactsQuery.status !== "success") {
			return []
		}

		const now = Date.now()
		const searchLower = search.toLowerCase().trim()

		return contactsQuery.data
			.filter(contact => {
				if (search.length > 0) {
					const name = contactDisplayName(contact).toLowerCase().trim()
					const email = contact.email.toLowerCase().trim()
					const match = name.includes(searchLower) || email.includes(searchLower)

					if (!match) {
						return false
					}
				}

				if (contact.type !== "contact") {
					return true
				}

				if (type === "online") {
					return contact.lastActive > now - ONLINE_TIMEOUT
				} else if (type === "offline") {
					return contact.lastActive <= now - ONLINE_TIMEOUT
				}

				return true
			})
			.sort((a, b) => {
				const aIsOnline = (type === "offline" ? 0 : a.type === "contact" ? a.lastActive : 0) > now - ONLINE_TIMEOUT
				const bIsOnline = (type === "offline" ? 0 : b.type === "contact" ? b.lastActive : 0) > now - ONLINE_TIMEOUT

				if (aIsOnline && !bIsOnline) {
					return -1
				}

				if (!aIsOnline && bIsOnline) {
					return 1
				}

				return contactDisplayName(a)
					.toLowerCase()
					.localeCompare(contactDisplayName(b).toLowerCase(), globalThis.navigator.language, {
						numeric: true
					})
			})
	}, [contactsQuery.data, contactsQuery.status, type, search])

	const computeItemKey = useCallback((_: number, contact: ContactTagged) => contact.uuid, [])

	const itemContent = useCallback(
		(_: number, contact: ContactTagged) => {
			return (
				<ContactsListContact
					contact={contact}
					contactType={type === "blocked" ? "blocked" : "normal"}
					from={from}
				/>
			)
		},
		[type, from]
	)

	const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value)
	}, [])

	return (
		<div className={cn("flex flex-1 h-full flex-col gap-4", from === "select" ? "w-full" : "w-full xl:w-[75%]")}>
			<div className={cn("flex flex-row items-center pb-0 w-full", from === "select" ? "p-0" : "p-4")}>
				<Input
					placeholder={t("contacts.list.searchPlaceholder")}
					value={search}
					onChange={onSearchChange}
					type="search"
				/>
			</div>
			{from !== "select" && (
				<div className="px-4">
					<p className="text-sm text-muted-foreground">
						{type === "all"
							? t("contacts.list.all")
							: type === "online"
								? t("contacts.list.online")
								: type === "offline"
									? t("contacts.list.offline")
									: t("contacts.list.blocked")}
						&nbsp;&nbsp;—&nbsp;&nbsp;{contacts.length}
					</p>
				</div>
			)}
			<Virtuoso
				key={type}
				className="h-full w-full flex flex-1 overflow-x-hidden overflow-y-scroll"
				data={contacts}
				computeItemKey={computeItemKey}
				fixedItemHeight={52}
				defaultItemHeight={52}
				skipAnimationFrameInResizeObserver={true}
				totalCount={contacts.length}
				itemContent={itemContent}
				components={{
					EmptyPlaceholder: () => {
						if (contactsQuery.status === "success") {
							return null
						}

						return (
							<div className="flex flex-1 w-full h-auto flex-col overflow-hidden px-4">
								{Array.from(
									{
										length: Math.max(Math.ceil(window.innerHeight / 52 / 3), 3)
									},
									(_, i) => (
										<div
											key={i}
											className="flex flex-row items-center gap-4 justify-center h-[52px] py-2"
										>
											<Skeleton className="h-full w-auto rounded-full aspect-square" />
											<Skeleton className="h-full w-full rounded-lg" />
										</div>
									)
								)}
							</div>
						)
					}
				}}
			/>
		</div>
	)
})

ContactsList.displayName = "ContactsList"

export default ContactsList
