import { createFileRoute } from "@tanstack/react-router"
import ContactsList from "@/components/contacts/list"

export const Route = createFileRoute("/contacts/all")({
	component: ContactsList
})
