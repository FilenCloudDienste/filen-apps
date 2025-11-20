import View from "@/components/ui/view"
import Text from "@/components/ui/text"
import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import Button from "@/components/ui/button"
import auth from "@/lib/auth"
import { useRouter } from "expo-router"
import alerts from "@/lib/alerts"
import { memo } from "@/lib/memo"

export const Index = memo(() => {
	const router = useRouter()

	return (
		<Fragment>
			<Header title="Home" />
			<SafeAreaView edges={["left", "right"]}>
				<View className="gap-2">
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
					<Button
						onPress={async () => {
							alerts.error("This is a test error alert")
						}}
					>
						Show Error Alert
					</Button>
					<Button
						onPress={async () => {
							alerts.normal("This is a test normal alert")
						}}
					>
						Show Normal Alert
					</Button>
				</View>
			</SafeAreaView>
		</Fragment>
	)
})

export default Index
