import View from "@/components/ui/view"
import Text from "@/components/ui/text"
import { memo, Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import { Stack } from "expo-router"

export const SearchIndex = memo(() => {
	return (
		<Fragment>
			<Stack.Screen
				options={{
					headerTitle: "Search",
					headerShown: true
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<View>
					<Text>Welcome to the Search Page!</Text>
				</View>
			</SafeAreaView>
		</Fragment>
	)
})

SearchIndex.displayName = "SearchIndex"

export default SearchIndex
