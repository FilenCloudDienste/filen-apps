import { memo, useState, useEffect } from "react"
import { Modal, ActivityIndicator, Platform } from "react-native"
import { run, type DeferFn, type Result, type Options } from "@filen/utils"
import { FullWindowOverlay } from "react-native-screens"
import { FadeIn, FadeOut } from "react-native-reanimated"
import { AnimatedView } from "@/components/ui/animated"
import events from "@/lib/events"

export const FullScreenLoadingModalParent = memo(({ children, visible }: { children: React.ReactNode; visible: boolean }) => {
	if (Platform.OS === "ios" && !visible) {
		return null
	}

	return Platform.select({
		ios: <FullWindowOverlay>{children}</FullWindowOverlay>,
		default: (
			<Modal
				visible={visible}
				transparent={true}
				animationType="fade"
				presentationStyle="overFullScreen"
				onRequestClose={e => {
					e.preventDefault()
					e.stopPropagation()
				}}
				statusBarTranslucent={true}
				navigationBarTranslucent={true}
				allowSwipeDismissal={false}
			>
				{children}
			</Modal>
		)
	})
})

FullScreenLoadingModalParent.displayName = "FullScreenLoadingModalParent"

export const FullScreenLoadingModal = memo(() => {
	const [count, setCount] = useState<number>(0)

	useEffect(() => {
		const showFullScreenLoadingModalListener = events.subscribe("showFullScreenLoadingModal", () => {
			setCount(prev => prev + 1)
		})

		const hideFullScreenLoadingModalListener = events.subscribe("hideFullScreenLoadingModal", () => {
			setCount(prev => Math.max(0, prev - 1))
		})

		const forceHideFullScreenLoadingModalListener = events.subscribe("forceHideFullScreenLoadingModal", () => {
			setCount(0)
		})

		return () => {
			showFullScreenLoadingModalListener.remove()
			hideFullScreenLoadingModalListener.remove()
			forceHideFullScreenLoadingModalListener.remove()
		}
	}, [])

	return (
		<FullScreenLoadingModalParent visible={count > 0}>
			<AnimatedView
				className="flex-1 bg-black bg-opacity-50 justify-center items-center"
				entering={FadeIn}
				exiting={FadeOut}
			>
				<ActivityIndicator
					size="large"
					className="text-foreground"
				/>
			</AnimatedView>
		</FullScreenLoadingModalParent>
	)
})

FullScreenLoadingModal.displayName = "FullScreenLoadingModal"

export function forceHideFullScreenLoadingModal(): void {
	events.emit("forceHideFullScreenLoadingModal")
}

export async function runWithLoading<TResult, E = Error>(
	fn: (defer: DeferFn) => TResult | Promise<TResult>,
	options?: Options
): Promise<Result<TResult, E>> {
	return await run<TResult, E>(async defer => {
		events.emit("showFullScreenLoadingModal")

		defer(() => {
			events.emit("hideFullScreenLoadingModal")
		})

		return await fn(defer)
	}, options)
}

export default FullScreenLoadingModal
