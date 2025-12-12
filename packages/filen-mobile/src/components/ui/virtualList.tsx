import { useRef, useState } from "react"
import { withUniwind, useResolveClassNames } from "uniwind"
import { type View as RNView, RefreshControl, ActivityIndicator } from "react-native"
import View from "@/components/ui/view"
import useViewLayout from "@/hooks/useViewLayout"
import { cn, run, type DeferFn } from "@filen/utils"
import alerts from "@/lib/alerts"
import { AnimatedView } from "@/components/ui/animated"
import { FadeOut } from "react-native-reanimated"
import { memo, useCallback, useMemo } from "@/lib/memo"
import { LegendList, type LegendListRenderItemProps, type LegendListProps, type LegendListRef } from "@legendapp/list"

export type ListRenderItemInfo<
	Item,
	ItemType extends string | number | undefined = string | number | undefined
> = LegendListRenderItemProps<Item, ItemType>

export type ListRef = LegendListRef

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

export const VirtualListInner = memo(<T,>(props: LegendListProps<T> & React.RefAttributes<LegendListRef> & VirtualListExtraProps) => {
	const viewRef = useRef<RNView>(null)
	const { layout, onLayout } = useViewLayout(viewRef)
	const [refreshing, setRefreshing] = useState<boolean>(false)
	const textForeground = useResolveClassNames("text-foreground")

	const itemsPerRow = useMemo(() => {
		if (props.itemsPerRow) {
			return props.itemsPerRow
		}

		if (!props.grid || !props.itemWidth) {
			return 1
		}

		return Math.round(Math.max(1, Math.round(layout.width / props.itemWidth)))
	}, [props.grid, props.itemWidth, layout, props.itemsPerRow])

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

	if (props.grid && (typeof props.itemWidth !== "number" || typeof props.itemHeight !== "number")) {
		throw new Error("VirtualList in grid mode requires itemWidth and itemHeight props")
	}

	return (
		<View className="flex-1">
			<View
				ref={viewRef}
				className={cn("flex-1", props.parentClassName)}
				onLayout={onLayout}
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
				<LegendList<T>
					contentInsetAdjustmentBehavior="automatic"
					refreshing={refreshing}
					refreshControl={refreshControl}
					numColumns={itemsPerRow}
					recycleItems={false}
					maintainVisibleContentPosition={true}
					showsHorizontalScrollIndicator={!props.horizontal ? false : (props.data ?? []).length > 0 && !props.loading}
					showsVerticalScrollIndicator={props.horizontal ? false : (props.data ?? []).length > 0 && !props.loading}
					scrollEnabled={!props.loading && (props.data ?? []).length > 0}
					ListEmptyComponent={() => {
						if (props.loading) {
							return null
						}

						if (props.emptyComponent) {
							return (
								<View
									className="flex-1 bg-transparent"
									style={{
										width: layout.width,
										height: layout.height
									}}
								>
									{props.emptyComponent()}
								</View>
							)
						}

						return null
					}}
					ListFooterComponent={props.footerComponent}
					{...props}
				/>
			</View>
		</View>
	)
}) as (<T>(props: LegendListProps<T> & React.RefAttributes<LegendListRef> & VirtualListExtraProps) => React.JSX.Element) & {
	displayName?: string
}

export const VirtualList = withUniwind(VirtualListInner) as typeof VirtualListInner

export default VirtualList
