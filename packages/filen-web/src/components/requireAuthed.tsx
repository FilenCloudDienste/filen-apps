import { memo } from "react"
import useConfig from "@/hooks/useConfig"
import { Navigate } from "@tanstack/react-router"

export const RequireAuthed = memo(({ children }: { children: React.ReactNode }) => {
	const {
		config: { authed }
	} = useConfig()

	if (!authed) {
		return <Navigate to="/auth/login" />
	}

	return children
})

RequireAuthed.displayName = "RequireAuthed"

export default RequireAuthed
