import { memo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "@tanstack/react-router"

export const RequireUnauthed = memo(({ children }: { children: React.ReactNode }) => {
	const { authed } = useAuth()

	if (authed) {
		return <Navigate to="/" />
	}

	return children
})

RequireUnauthed.displayName = "RequireUnauthed"

export default RequireUnauthed
