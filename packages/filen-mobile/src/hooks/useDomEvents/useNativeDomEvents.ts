import { useCallback } from "react"
import type { DOMImperativeFactory } from "expo/dom"
import type { WebViewMessageEvent } from "react-native-webview"

export interface DOMRef extends DOMImperativeFactory {
	postMessage: (message: unknown) => void
}

export function useNativeDomEvents<T>(params: {
	onMessage?: (message: T, postMessage: (message: T) => void) => void
	ref: React.RefObject<DOMRef | null>
}) {
	const postMessage = useCallback(
		(message: T) => {
			;(async () => {
				while (!params.ref.current) {
					await new Promise<void>(resolve => setTimeout(resolve, 10))
				}

				try {
					params.ref.current.postMessage(message)
				} catch (e) {
					console.error(e)
				}
			})()
		},
		[params]
	)

	const onDomMessage = useCallback(
		(message: WebViewMessageEvent) => {
			if (!params.onMessage) {
				return
			}

			try {
				params.onMessage(JSON.parse(message.nativeEvent.data) as T, postMessage)
			} catch (e) {
				console.error(e)
			}
		},
		[params, postMessage]
	)

	return {
		onDomMessage,
		postMessage
	}
}
