import { memo, useMemo, useRef, useState, useCallback } from "react"
import { withUniwind } from "uniwind"
import { type FlatListProps, type View as RNView, RefreshControl, FlatList } from "react-native"
import View from "@/components/ui/view"
import useViewLayout from "@/hooks/useViewLayout"
import { cn, run, type DeferFn } from "@filen/utils"
import alerts from "@/lib/alerts"

export type VirtualListExtraProps = {
	itemHeight?: number
	parentClassName?: string
	onRefresh?: (defer: DeferFn) => Promise<void> | void
}

export const VirtualListInner = memo(<T,>(props: FlatListProps<T> & React.RefAttributes<FlatList<T>> & VirtualListExtraProps) => {
	const viewRef = useRef<RNView>(null)
	const { layout, onLayout } = useViewLayout(viewRef)
	const [refreshing, setRefreshing] = useState<boolean>(false)

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

	const onRefresh = useCallback(async () => {
		if (!props.onRefresh) {
			return
		}

		const result = await run(async defer => {
			setRefreshing(true)

			defer(() => {
				setRefreshing(false)
			})

			await props.onRefresh?.(defer)
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [props])

	const refreshControl = useMemo(() => {
		if (!props.onRefresh) {
			return undefined
		}

		return (
			<RefreshControl
				refreshing={refreshing}
				onRefresh={onRefresh}
			/>
		)
	}, [props, refreshing, onRefresh])

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
				refreshing={refreshing}
				refreshControl={refreshControl}
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
