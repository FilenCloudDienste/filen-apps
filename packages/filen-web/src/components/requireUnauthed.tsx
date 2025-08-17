import { memo } from "react"
import useConfig from "@/hooks/useConfig"
import { Navigate } from "@tanstack/react-router"

export const RequireUnauthed = memo(({ children }: { children: React.ReactNode }) => {
	const {
		config: { authed }
	} = useConfig()

	if (authed) {
		return <Navigate to="/" />
	}

	return children
})

RequireUnauthed.displayName = "RequireUnauthed"

export default RequireUnauthed
