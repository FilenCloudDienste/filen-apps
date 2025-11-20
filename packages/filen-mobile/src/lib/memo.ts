/* eslint-disable react-hooks/refs */

import {
	memo as reactMemo,
	useMemo as reactUseMemo,
	useCallback as reactUseCallback,
	type ComponentType,
	useRef,
	type DependencyList
} from "react"
import isEqual from "react-fast-compare"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function memo<T extends ComponentType<any>>(...params: Parameters<typeof reactMemo<T>>): ReturnType<typeof reactMemo<T>> {
	return reactMemo<T>(params[0], params[1] ? params[1] : isEqual)
}

export function useMemo<T>(...params: Parameters<typeof reactUseMemo<T>>): ReturnType<typeof reactUseMemo<T>> {
	const depsRef = useRef<DependencyList>(params[1])
	const valueRef = useRef<T | undefined>(undefined)
	const isInitialMount = useRef<boolean>(true)

	if (isInitialMount.current || !isEqual(depsRef.current, params[1])) {
		valueRef.current = params[0]()
		depsRef.current = params[1]
		isInitialMount.current = false
	}

	return valueRef.current as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useCallback<T extends (...args: any) => any>(
	...params: Parameters<typeof reactUseCallback<T>>
): ReturnType<typeof reactUseCallback<T>> {
	const depsRef = useRef<DependencyList>(params[1])
	const callbackRef = useRef<T>(params[0])
	const isInitialMount = useRef<boolean>(true)

	if (isInitialMount.current || !isEqual(depsRef.current, params[1])) {
		callbackRef.current = params[0]
		depsRef.current = params[1]
		isInitialMount.current = false
	}

	return callbackRef.current
}
