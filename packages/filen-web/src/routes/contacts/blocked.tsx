import { createFileRoute } from "@tanstack/react-router"
import ContactsList from "@/components/contacts/list"
import { memo } from "react"

export const RouteComponent = memo(() => {
	return (
		<ContactsList
			type="blocked"
			from="contacts"
		/>
	)
})

RouteComponent.displayName = "RouteComponent"

export const Route = createFileRoute("/contacts/blocked")({
	component: RouteComponent
})
