import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"

export const NotesIndex = memo(() => {
	return (
		<Fragment>
			<Header title="Notes" />
			<SafeAreaView edges={["left", "right"]}>
				<Text>Welcome to the Notes Page!</Text>
			</SafeAreaView>
		</Fragment>
	)
})

NotesIndex.displayName = "NotesIndex"

export default NotesIndex
