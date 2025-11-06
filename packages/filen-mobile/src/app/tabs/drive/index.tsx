import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"

export const DriveIndex = memo(() => {
	return (
		<Fragment>
			<Header title="Drive" />
			<SafeAreaView edges={["left", "right"]}>
				<Text>Welcome to the Drive Page!</Text>
			</SafeAreaView>
		</Fragment>
	)
})

DriveIndex.displayName = "DriveIndex"

export default DriveIndex
