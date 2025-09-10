import { createFileRoute, Navigate } from "@tanstack/react-router"
import { memo } from "react"

export const RouteComponent = memo(() => {
	return <Navigate to="/contacts/all" />
})

RouteComponent.displayName = "RouteComponent"

export const Route = createFileRoute("/contacts/")({
	component: RouteComponent
})
