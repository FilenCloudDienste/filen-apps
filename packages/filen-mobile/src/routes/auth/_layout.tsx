import { Stack, Redirect } from "expo-router"
import { memo } from "@/lib/memo"
import { useIsAuthed } from "@/lib/auth"
import View from "@/components/ui/view"

export const AuthLayout = memo(() => {
	const isAuthed = useIsAuthed()

	if (isAuthed) {
		return <Redirect href="/tabs/drive" />
	}

	return (
		<View className="flex-1">
			<Stack />
		</View>
	)
})

export default AuthLayout
