import { memo } from "react"
import { withUniwind } from "uniwind"
import { ScrollView } from "react-native-gesture-handler"
import { FlashList, type FlashListProps, type FlashListRef } from "@shopify/flash-list"

export const VirtualListInner = memo(<T,>(props: FlashListProps<T> & React.RefAttributes<FlashListRef<T>>) => {
	return (
		<FlashList<T>
			renderScrollComponent={scrollViewProps => <ScrollView {...scrollViewProps} />}
			maxItemsInRecyclePool={0}
			drawDistance={0}
			{...props}
		/>
	)
}) as (<T>(props: FlashListProps<T> & React.RefAttributes<FlashListRef<T>>) => React.JSX.Element) & {
	displayName?: string
}

VirtualListInner.displayName = "VirtualList"

export const VirtualList = withUniwind(VirtualListInner) as typeof VirtualListInner

export default VirtualList
