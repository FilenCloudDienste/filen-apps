import { memo, useMemo, useRef, useState, useCallback } from "react"
import { withUniwind, useResolveClassNames } from "uniwind"
import { type FlatListProps, type View as RNView, RefreshControl, FlatList, ActivityIndicator } from "react-native"
import View from "@/components/ui/view"
import useViewLayout from "@/hooks/useViewLayout"
import { cn, run, type DeferFn } from "@filen/utils"
import alerts from "@/lib/alerts"
import { AnimatedView } from "@/components/ui/animated"
import { FadeOut, useAnimatedStyle } from "react-native-reanimated"
import { useKeyboardAnimation } from "react-native-keyboard-controller"

export type VirtualListExtraProps = {
	itemHeight?: number
	parentClassName?: string
	onRefresh?: (defer: DeferFn) => Promise<void> | void
	grid?: boolean
	itemWidth?: number
	itemsPerRow?: number
	loading?: boolean
	emptyComponent?: () => React.ReactNode
	footerComponent?: () => React.ReactNode
}

export const VirtualListInner = memo(<T,>(props: FlatListProps<T> & React.RefAttributes<FlatList<T>> & VirtualListExtraProps) => {
	const viewRef = useRef<RNView>(null)
	const { layout, onLayout } = useViewLayout(viewRef)
	const [refreshing, setRefreshing] = useState<boolean>(false)
	const textForeground = useResolveClassNames("text-foreground")
	const { height } = useKeyboardAnimation()

	const itemsPerRow = useMemo(() => {
		if (props.itemsPerRow) {
			return props.itemsPerRow
		}

		if (!props.grid || !props.itemWidth) {
			return 1
		}

		return Math.max(1, Math.floor(layout.width / props.itemWidth))
	}, [props.grid, props.itemWidth, layout, props.itemsPerRow])

	const itemsInView = useMemo(() => {
		if (!props.itemHeight) {
			return undefined
		}

		if (props.grid) {
			return Math.max(1, Math.floor(Math.floor(layout.height / props.itemHeight) * itemsPerRow))
		}

		return Math.max(1, Math.ceil(layout.height / props.itemHeight))
	}, [layout.height, props.itemHeight, props.grid, itemsPerRow])

	const initialNumToRender = useMemo(() => {
		if (props.grid) {
			if (!itemsInView) {
				return undefined
			}

			return Math.max(1, Math.floor(Math.floor(itemsInView / itemsPerRow) * itemsPerRow))
		}

		return itemsInView
	}, [props.grid, itemsInView, itemsPerRow])

	const getItemLayout = useMemo(() => {
		if (props.grid) {
			if (!props.itemWidth) {
				return undefined
			}

			return (_: ArrayLike<T> | null | undefined, index: number) => {
				if (!props.itemHeight) {
					throw new Error("itemHeight is required for getItemLayout")
				}

				const rowIndex = Math.max(0, Math.floor(index / itemsPerRow))

				return {
					length: props.itemHeight,
					offset: props.itemHeight * rowIndex,
					index
				}
			}
		}

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
	}, [props.itemHeight, props.grid, props.itemWidth, itemsPerRow])

	const maxToRenderPerBatch = useMemo(() => {
		if (!itemsInView) {
			return undefined
		}

		return Math.max(1, itemsInView / 2)
	}, [itemsInView])

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

	const animatedStyle = useAnimatedStyle(() => {
		return {
			paddingBottom: height
		}
	}, [])

	if (!props.keyExtractor) {
		throw new Error("VirtualList requires a keyExtractor prop")
	}

	if (props.grid && (typeof props.itemWidth !== "number" || typeof props.itemHeight !== "number")) {
		throw new Error("VirtualList in grid mode requires itemWidth and itemHeight props")
	}

	return (
		<View
			ref={viewRef}
			className={cn("flex-1", props.parentClassName)}
			onLayout={onLayout}
		>
			<AnimatedView
				className="flex-1"
				style={animatedStyle}
			>
				{props.loading && (
					<AnimatedView
						className="absolute inset-0 z-99 bg-background items-center justify-center"
						exiting={FadeOut}
					>
						<ActivityIndicator
							size="large"
							color={textForeground.color as string}
						/>
					</AnimatedView>
				)}
				<FlatList<T>
					key={itemsPerRow}
					windowSize={3}
					initialNumToRender={initialNumToRender}
					contentInsetAdjustmentBehavior="automatic"
					getItemLayout={getItemLayout}
					maxToRenderPerBatch={maxToRenderPerBatch}
					updateCellsBatchingPeriod={100}
					refreshing={refreshing}
					refreshControl={refreshControl}
					numColumns={itemsPerRow}
					ListEmptyComponent={() => {
						if (props.loading) {
							return null
						}

						if (props.emptyComponent) {
							return (
								<AnimatedView
									className="flex-1"
									style={{
										width: layout.width,
										height: layout.height
									}}
								>
									{props.emptyComponent()}
								</AnimatedView>
							)
						}

						return null
					}}
					ListFooterComponent={props.footerComponent}
					{...props}
				/>
			</AnimatedView>
		</View>
	)
}) as (<T>(props: FlatListProps<T> & React.RefAttributes<FlatList<T>> & VirtualListExtraProps) => React.JSX.Element) & {
	displayName?: string
}

VirtualListInner.displayName = "VirtualList"

export const VirtualList = withUniwind(VirtualListInner) as typeof VirtualListInner

export default VirtualList
