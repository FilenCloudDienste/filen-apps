import { Redirect } from "expo-router"
import { useIsAuthed } from "@/lib/auth"

export default function Index() {
	const isAuthed = useIsAuthed()

	if (!isAuthed) {
		return <Redirect href="/auth/login" />
	}

	return <Redirect href="/tabs/home" />
}
