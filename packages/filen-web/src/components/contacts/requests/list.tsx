import { memo, useMemo, useCallback, useState } from "react"
import useContactRequestsQuery from "@/queries/useContactRequests.query"
import { contactDisplayName } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import { Input } from "@/components/ui/input"
import type { ContactRequestIn, ContactRequestOut } from "@filen/sdk-rs"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@/components/ui/skeleton"
import ContactsRequestsListRequest from "./request"

export const ContactsRequestsList = memo(({ type }: { type: "incoming" | "outgoing" }) => {
	const [search, setSearch] = useState<string>("")
	const { t } = useTranslation()

	const contactRequestsQuery = useContactRequestsQuery()

	const requests = useMemo(() => {
		if (contactRequestsQuery.status !== "success") {
			return {
				incoming: [],
				outgoing: []
			}
		}

		const searchLower = search.toLowerCase().trim()

		return {
			incoming: contactRequestsQuery.data.incoming
				.filter(request => {
					if (search.length > 0) {
						const name = contactDisplayName(request).toLowerCase().trim()
						const email = request.email.toLowerCase().trim()
						const match = name.includes(searchLower) || email.includes(searchLower)

						if (!match) {
							return false
						}
					}

					return true
				})
				.sort((a, b) => {
					return contactDisplayName(a)
						.toLowerCase()
						.localeCompare(contactDisplayName(b).toLowerCase(), globalThis.navigator.language, {
							numeric: true
						})
				}),
			outgoing: contactRequestsQuery.data.outgoing
				.filter(request => {
					if (search.length > 0) {
						const name = contactDisplayName(request).toLowerCase().trim()
						const email = request.email.toLowerCase().trim()
						const match = name.includes(searchLower) || email.includes(searchLower)

						if (!match) {
							return false
						}
					}

					return true
				})
				.sort((a, b) => {
					return contactDisplayName(a)
						.toLowerCase()
						.localeCompare(contactDisplayName(b).toLowerCase(), globalThis.navigator.language, {
							numeric: true
						})
				})
		}
	}, [contactRequestsQuery.data, contactRequestsQuery.status, search])

	const computeItemKey = useCallback((_: number, request: ContactRequestIn | ContactRequestOut) => request.uuid, [])

	const itemContent = useCallback(
		(_: number, request: ContactRequestIn | ContactRequestOut) => {
			return (
				<ContactsRequestsListRequest
					request={request}
					type={type}
				/>
			)
		},
		[type]
	)

	const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value)
	}, [])

	return (
		<div className="flex flex-1 h-full flex-col gap-4 w-full xl:w-[75%]">
			<div className="flex flex-row items-center p-4 pb-0 w-full">
				<Input
					placeholder={t("contacts.requests.list.searchPlaceholder")}
					value={search}
					onChange={onSearchChange}
					type="search"
				/>
			</div>
			<div className="px-4">
				<p className="text-sm text-muted-foreground">
					{type === "incoming" ? t("contacts.list.requests") : t("contacts.list.pending")}
					&nbsp;&nbsp;—&nbsp;&nbsp;{type === "incoming" ? requests.incoming.length : requests.outgoing.length}
				</p>
			</div>
			<Virtuoso
				key={type}
				className="h-full w-full flex flex-1 overflow-x-hidden overflow-y-scroll"
				data={type === "incoming" ? requests.incoming : requests.outgoing}
				computeItemKey={computeItemKey}
				fixedItemHeight={52}
				defaultItemHeight={52}
				skipAnimationFrameInResizeObserver={true}
				totalCount={type === "incoming" ? requests.incoming.length : requests.outgoing.length}
				itemContent={itemContent}
				components={{
					EmptyPlaceholder: () => {
						if (contactRequestsQuery.status === "success") {
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

ContactsRequestsList.displayName = "ContactsRequestsList"

export default ContactsRequestsList
