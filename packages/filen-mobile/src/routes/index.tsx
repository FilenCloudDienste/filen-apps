import View from "@/components/view"
import Text from "@/components/text"
import { memo } from "react"

export const Index = memo(() => {
	return (
		<View>
			<Text>Welcome to the Index Page!</Text>
		</View>
	)
})

Index.displayName = "Index"

export default Index
