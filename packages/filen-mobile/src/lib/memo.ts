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
function memoInner<T extends ComponentType<any>>(
	component: T,
	options?: {
		propsAreEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean
	}
): ReturnType<typeof reactMemo<T>> {
	return reactMemo<T>(component, options?.propsAreEqual ? options.propsAreEqual : isEqual)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function memoInnerDev<T extends ComponentType<any>>(
	component: T,
	options?: {
		propsAreEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean
	}
): ReturnType<typeof reactMemo<T>> {
	return reactMemo<T>(component, options?.propsAreEqual)
}

export const memo = __DEV__ ? memoInnerDev : memoInner

function useMemoInner<T>(...params: Parameters<typeof reactUseMemo<T>>): ReturnType<typeof reactUseMemo<T>> {
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

export const useMemo = __DEV__ ? reactUseMemo : useMemoInner

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useCallbackInner<T extends (...args: any) => any>(
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

export const useCallback = __DEV__ ? reactUseCallback : useCallbackInner
