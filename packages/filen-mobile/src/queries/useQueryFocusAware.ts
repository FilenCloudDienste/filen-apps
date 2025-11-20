import { useRef } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback } from "@/lib/memo"

export default function useQueryFocusAware() {
	const focusedRef = useRef<boolean>(true)

	useFocusEffect(
		useCallback(() => {
			focusedRef.current = true

			return () => {
				focusedRef.current = false
			}
		}, [])
	)

	return () => focusedRef.current
}
