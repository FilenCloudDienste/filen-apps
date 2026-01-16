import { useEffect, useRef } from "react"

export default function useEffectOnce(effect: React.EffectCallback) {
	const didRun = useRef<boolean>(false)

	useEffect(() => {
		if (didRun.current) {
			return
		}

		didRun.current = true

		return effect()
	}, [effect])
}
