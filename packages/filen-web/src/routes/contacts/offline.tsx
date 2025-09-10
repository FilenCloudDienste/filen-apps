import { createFileRoute } from "@tanstack/react-router"
import ContactsList from "@/components/contacts/list"
import { memo } from "react"

export const RouteComponent = memo(() => {
	return (
		<ContactsList
			type="offline"
			from="contacts"
		/>
	)
})

RouteComponent.displayName = "RouteComponent"

export const Route = createFileRoute("/contacts/offline")({
	component: RouteComponent
})
