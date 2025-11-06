import { useRef, useCallback } from "react"
import { useFocusEffect } from "@react-navigation/native"
import type { UseQueryResult } from "@tanstack/react-query"

export default function useRefreshOnFocus({
	isEnabled,
	refetch
}: {
	isEnabled: UseQueryResult["isEnabled"]
	refetch: UseQueryResult["refetch"]
}): void {
	const firstTimeRef = useRef<boolean>(true)

	useFocusEffect(
		useCallback(() => {
			if (firstTimeRef.current) {
				firstTimeRef.current = false

				return
			}

			if (!isEnabled) {
				return
			}

			refetch().catch(() => {})
		}, [isEnabled, refetch])
	)
}
