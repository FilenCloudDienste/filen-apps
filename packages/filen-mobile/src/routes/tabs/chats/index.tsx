import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { memo } from "@/lib/memo"
import { Platform } from "react-native"
import List from "@/components/chats/list"

export const Chats = memo(() => {
	return (
		<Fragment>
			<Header
				title="tbd_chats"
				transparent={Platform.OS === "ios"}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<List />
			</SafeAreaView>
		</Fragment>
	)
})

export default Chats
