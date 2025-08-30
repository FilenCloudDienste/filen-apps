import { memo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "@tanstack/react-router"

export const RequireAuthed = memo(({ children }: { children: React.ReactNode }) => {
	const { authed } = useAuth()

	if (!authed) {
		return <Navigate to="/auth/login" />
	}

	return children
})

RequireAuthed.displayName = "RequireAuthed"

export default RequireAuthed
