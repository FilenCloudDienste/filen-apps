import { createFileRoute } from "@tanstack/react-router"
import ContactsRequestsList from "@/components/contacts/requests/list"
import { memo } from "react"

export const RouteComponent = memo(() => {
	return <ContactsRequestsList type="outgoing" />
})

RouteComponent.displayName = "RouteComponent"

export const Route = createFileRoute("/contacts/pending")({
	component: RouteComponent
})
