import useTransfersStore from "@/stores/useTransfers.store"
import { useShallow } from "zustand/shallow"
import { memo, useMemo, useCallback } from "@/lib/memo"
import { Fragment } from "react"
import View, { CrossGlassContainerView } from "@/components/ui/view"
import Text from "@/components/ui/text"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { Platform } from "react-native"
import * as Progress from "react-native-progress"
import { useResolveClassNames } from "uniwind"
import { bpsToReadable } from "@filen/utils"
import { PressableScale } from "@/components/ui/pressables"
import { router } from "expo-router"

const TransfersInner = memo(() => {
	const activeTransfers = useTransfersStore(useShallow(state => state.transfers.filter(t => !t.finishedAt)))
	const textBlue500 = useResolveClassNames("text-blue-500")
	const bgBackgroundTertiary = useResolveClassNames("bg-background-tertiary")

	const { progress, speed } = useMemo((): {
		progress: number
		uploadsCount: number
		downloadsCount: number
		transfersCount: number
		speed: number
		totalSize: number
	} => {
		if (activeTransfers.length === 0) {
			return {
				progress: 0,
				uploadsCount: 0,
				downloadsCount: 0,
				transfersCount: 0,
				speed: 0,
				totalSize: 0
			}
		}

		let totalSize = 0
		let bytesTransferred = 0
		let uploadsCount = 0
		let downloadsCount = 0
		let firstProgressAt: number | null = null

		for (const transfer of activeTransfers) {
			totalSize += transfer.size
			bytesTransferred += transfer.bytesTransferred

			if (transfer.type === "uploadFile" || transfer.type === "uploadDirectory") {
				uploadsCount += 1
			} else {
				downloadsCount += 1
			}

			if (
				transfer.lastProgressBytesTransferredAt &&
				(firstProgressAt === null || transfer.lastProgressBytesTransferredAt < firstProgressAt)
			) {
				firstProgressAt = transfer.lastProgressBytesTransferredAt
			}
		}

		let speed = 0

		if (firstProgressAt !== null) {
			const timeElapsedSeconds = (Date.now() - firstProgressAt) / 1000

			speed = Math.max(0, bytesTransferred / timeElapsedSeconds)
		}

		return {
			progress: Math.min(1, Math.max(0, bytesTransferred / totalSize)),
			uploadsCount,
			downloadsCount,
			transfersCount: activeTransfers.length,
			speed,
			totalSize
		}
	}, [activeTransfers])

	return (
		<Fragment>
			<View className="flex-row items-center justify-between bg-transparent px-4 py-3 gap-4 flex-1">
				<Text
					className="shrink-0 flex-1"
					numberOfLines={1}
					ellipsizeMode="middle"
				>
					{activeTransfers.length} active transfer{activeTransfers.length !== 1 ? "s" : ""}
				</Text>
				<Text
					className="shrink-0"
					numberOfLines={1}
					ellipsizeMode="middle"
				>
					{bpsToReadable(speed)}
				</Text>
			</View>
			{progress > 0 && (
				<Progress.Bar
					width={null}
					height={4}
					progress={1}
					color={textBlue500.color as string | undefined}
					borderColor={textBlue500.color as string | undefined}
					borderWidth={0}
					borderRadius={0}
					unfilledColor={bgBackgroundTertiary.color as string | undefined}
					animated={true}
				/>
			)}
		</Fragment>
	)
})

const Transfers = memo(() => {
	const insets = useSafeAreaInsets()
	const transfersActive = useTransfersStore(useShallow(state => state.transfers.filter(t => !t.finishedAt).length >= 0))

	const onPress = useCallback(() => {
		router.push("/transfers")
	}, [])

	if (!transfersActive) {
		return null
	}

	return (
		<AnimatedView
			className="absolute left-0 right-0 bg-transparent px-4"
			entering={FadeIn}
			exiting={FadeOut}
			style={{
				bottom:
					insets.bottom +
					Platform.select({
						ios: 60,
						default: 90
					})
			}}
		>
			<PressableScale
				rippleColor="transparent"
				onPress={onPress}
			>
				<CrossGlassContainerView
					disableBlur={Platform.OS === "android"}
					className="flex-col overflow-hidden"
				>
					<TransfersInner />
				</CrossGlassContainerView>
			</PressableScale>
		</AnimatedView>
	)
})

export default Transfers
