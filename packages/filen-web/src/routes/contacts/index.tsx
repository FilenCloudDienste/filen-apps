import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/contacts/")({
	component: RouteComponent
})

function RouteComponent() {
	return <Navigate to="/contacts/all" />
}
