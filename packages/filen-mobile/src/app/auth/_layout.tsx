import { Stack, Redirect } from "expo-router"
import { memo } from "react"
import { useIsAuthed } from "@/lib/auth"

export const AuthLayout = memo(() => {
	const isAuthed = useIsAuthed()

	if (isAuthed) {
		return <Redirect href="/tabs/home" />
	}

	return <Stack />
})

AuthLayout.displayName = "AuthLayout"

export default AuthLayout
