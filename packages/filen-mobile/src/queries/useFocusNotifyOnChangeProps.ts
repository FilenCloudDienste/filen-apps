import { useRef } from "react"
import type { NotifyOnChangeProps } from "@tanstack/query-core"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "@/lib/memo"

export default function useFocusNotifyOnChangeProps(notifyOnChangeProps?: NotifyOnChangeProps) {
	const focusedRef = useRef<boolean>(true)

	useFocusEffect(
		useCallback(() => {
			focusedRef.current = true

			return () => {
				focusedRef.current = false
			}
		}, [])
	)

	return () => {
		if (!focusedRef.current) {
			return []
		}

		if (typeof notifyOnChangeProps === "function") {
			return notifyOnChangeProps()
		}

		return notifyOnChangeProps
	}
}
