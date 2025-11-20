import Text from "@/components/ui/text"
import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { memo } from "@/lib/memo"

export const ChatsIndex = memo(() => {
	return (
		<Fragment>
			<Header title="Chats" />
			<SafeAreaView edges={["left", "right"]}>
				<Text>Welcome to the Chats Page!</Text>
			</SafeAreaView>
		</Fragment>
	)
})

export default ChatsIndex
