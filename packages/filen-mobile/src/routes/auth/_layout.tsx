import { Stack, Redirect } from "expo-router"
import { memo } from "@/lib/memo"
import { useIsAuthed } from "@/lib/auth"

export const AuthLayout = memo(() => {
	const isAuthed = useIsAuthed()

	if (isAuthed) {
		return <Redirect href="/tabs/drive" />
	}

	return <Stack />
})

export default AuthLayout
