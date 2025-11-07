import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"

export const PhotosIndex = memo(() => {
	return (
		<Fragment>
			<Header title="Photos" />
			<SafeAreaView edges={["left", "right"]}>
				<Text>Welcome to the Photos Page!</Text>
			</SafeAreaView>
		</Fragment>
	)
})

PhotosIndex.displayName = "PhotosIndex"

export default PhotosIndex
