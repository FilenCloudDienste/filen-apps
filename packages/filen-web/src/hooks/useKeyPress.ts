import { useCallback, useEffect } from "react"

export function useKeyPress({
	key,
	modifiers,
	onKeyPress
}: {
	key: KeyboardEvent["key"]
	modifiers?: ("Alt" | "Control" | "Fn" | "Meta" | "OS" | "Shift")[]
	onKeyPress?: (event: KeyboardEvent) => void
}) {
	const keyPressHandler = useCallback(
		(event: KeyboardEvent) => {
			const isModifierPressed = modifiers ? modifiers.some(modKey => event.getModifierState(modKey)) : true

			if (event.key === key && isModifierPressed) {
				onKeyPress?.(event)
			}
		},
		[key, modifiers, onKeyPress]
	)

	useEffect(() => {
		globalThis.window.addEventListener("keydown", keyPressHandler)

		return () => {
			globalThis.window.removeEventListener("keydown", keyPressHandler)
		}
	}, [keyPressHandler])
}

export default useKeyPress
