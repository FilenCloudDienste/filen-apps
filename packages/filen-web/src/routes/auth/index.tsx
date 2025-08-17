import { createFileRoute, Navigate } from "@tanstack/react-router"
import { memo } from "react"

export const Auth = memo(() => {
	return <Navigate to="/auth/login" />
})

Auth.displayName = "Auth"

export const Route = createFileRoute("/auth/")({
	component: Auth
})
