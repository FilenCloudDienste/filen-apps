import View from "@/components/ui/view"
import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import Button from "@/components/ui/button"
import auth from "@/lib/auth"
import { useRouter } from "expo-router"
import alerts from "@/lib/alerts"
import prompts from "@/lib/prompts"

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
					<Button
						onPress={async () => {
							const result = await prompts.input({
								title: "Enter your name",
								placeholder: "Name",
								inputType: "secure-text",
								okText: "OK",
								cancelText: "Cancel"
							})

							if (!result.cancelled) {
								alerts.normal(`You entered: ${result.value}`)
							} else {
								alerts.normal("Prompt was cancelled")
							}
						}}
					>
						Show Prompt Alert
					</Button>
					<Button
						onPress={async () => {
							const result = await prompts.alert({
								title: "hi",
								message: "This is an alert",
								okText: "OK",
								cancelText: "Cancel"
							})

							if (!result.cancelled) {
								alerts.normal("ok")
							} else {
								alerts.normal("Prompt was cancelled")
							}
						}}
					>
						Show Alert
					</Button>
				</View>
			</SafeAreaView>
		</Fragment>
	)
})

Index.displayName = "Index"

export default Index
