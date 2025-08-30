import { createFileRoute, Navigate } from "@tanstack/react-router"
import { memo } from "react"
import { useAuth } from "@/hooks/useAuth"

export const Index = memo(() => {
	const { authed } = useAuth()

	if (!authed) {
		return <Navigate to="/auth/login" />
	}

	return <Navigate to="/drive" />
})

Index.displayName = "Index"

export const Route = createFileRoute("/")({
	component: Index
})
