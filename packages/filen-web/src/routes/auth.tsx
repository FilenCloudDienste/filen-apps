import { createFileRoute, Outlet } from "@tanstack/react-router"
import RequireUnauthed from "@/components/requireUnauthed"
import { memo } from "react"

export const Auth = memo(() => {
	return (
		<RequireUnauthed>
			<Outlet />
		</RequireUnauthed>
	)
})

Auth.displayName = "Auth"

export const Route = createFileRoute("/auth")({
	component: Auth
})
