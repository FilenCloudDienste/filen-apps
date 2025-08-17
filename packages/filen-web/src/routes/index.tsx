import { createFileRoute, Navigate } from "@tanstack/react-router"
import { memo } from "react"
import useConfig from "@/hooks/useConfig"

export const Index = memo(() => {
	const {
		config: { authed }
	} = useConfig()

	if (!authed) {
		return <Navigate to="/auth/login" />
	}

	return <Navigate to="/drive" />
})

Index.displayName = "Index"

export const Route = createFileRoute("/")({
	component: Index
})
