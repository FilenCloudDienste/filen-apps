import { memo, useMemo, useRef } from "react"
import { withUniwind } from "uniwind"
import { FlatList } from "react-native-gesture-handler"
import type { FlatListProps, View as RNView } from "react-native"
import View from "@/components/ui/view"
import useViewLayout from "@/hooks/useViewLayout"
import { cn } from "@filen/utils"

export type VirtualListExtraProps = {
	itemHeight?: number
	parentClassName?: string
}

export const VirtualListInner = memo(<T,>(props: FlatListProps<T> & React.RefAttributes<FlatList<T>> & VirtualListExtraProps) => {
	const viewRef = useRef<RNView>(null)
	const { layout, onLayout } = useViewLayout(viewRef)

	const initialNumToRender = useMemo(() => {
		if (!layout || props.data?.length === 0 || !props.itemHeight) {
			return undefined
		}

		const itemsInView = Math.ceil(layout.height / props.itemHeight)

		return itemsInView
	}, [layout, props.data, props.itemHeight])

	const getItemLayout = useMemo(() => {
		if (!props.itemHeight) {
			return undefined
		}

		return (_: ArrayLike<T> | null | undefined, index: number) => {
			if (!props.itemHeight) {
				throw new Error("itemHeight is required for getItemLayout")
			}

			return {
				length: props.itemHeight,
				offset: props.itemHeight * index,
				index
			}
		}
	}, [props.itemHeight])

	const maxToRenderPerBatch = useMemo(() => {
		if (!layout || !props.itemHeight) {
			return undefined
		}

		const itemsInView = Math.ceil(layout.height / props.itemHeight)

		return Math.min(1, itemsInView / 2)
	}, [layout, props.itemHeight])

	if (!props.keyExtractor) {
		throw new Error("VirtualList requires a keyExtractor prop")
	}

	return (
		<View
			ref={viewRef}
			className={cn("flex-1", props.parentClassName)}
			onLayout={onLayout}
		>
			<FlatList<T>
				windowSize={3}
				initialNumToRender={initialNumToRender}
				contentInsetAdjustmentBehavior="automatic"
				getItemLayout={getItemLayout}
				maxToRenderPerBatch={maxToRenderPerBatch}
				updateCellsBatchingPeriod={100}
				{...props}
			/>
		</View>
	)
}) as (<T>(props: FlatListProps<T> & React.RefAttributes<FlatList<T>> & VirtualListExtraProps) => React.JSX.Element) & {
	displayName?: string
}

VirtualListInner.displayName = "VirtualList"

export const VirtualList = withUniwind(VirtualListInner) as typeof VirtualListInner

export default VirtualList
