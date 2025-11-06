import View from "@/components/ui/view"
import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import Button from "@/components/ui/button"
import auth from "@/lib/auth"
import { useRouter } from "expo-router"

export const Index = memo(() => {
	const router = useRouter()

	console.log("Notes:", new Date().getTime())

	return (
		<Fragment>
			<Header title="Home" />
			<SafeAreaView edges={["left", "right"]}>
				<View>
					<Text>Welcome to the Index Page!</Text>
					<Button
						onPress={async () => {
							await auth.logout()

							console.log("Logged out")

							router.replace("/auth/login")
						}}
					>
						Logout
					</Button>
				</View>
			</SafeAreaView>
		</Fragment>
	)
})

Index.displayName = "Index"

export default Index
