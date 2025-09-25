import { useEffect, useState, useCallback, useRef } from "react"
import idb from "@/lib/idb"
import events from "@/lib/events"
import cacheMap from "@/lib/cacheMap"
import Semaphore from "@/lib/semaphore"

const flushMutex = new Semaphore(1)

export function useIdb<T>(key: string, initialValue: T): [T, (fn: T | ((prev: T) => void)) => void, boolean] {
	const kvValueRef = useRef<T | null>(cacheMap.kv.get(key) ?? null)
	const [state, setState] = useState<T>(kvValueRef.current ?? initialValue)
	const [loaded, setLoaded] = useState<boolean>(kvValueRef.current ? true : false)
	const didRetrieveRef = useRef<boolean>(false)

	const flush = useCallback(
		async (before: T, now: T) => {
			await flushMutex.acquire()

			try {
				await idb.set(key, now)
			} catch (e) {
				console.error("Error setting value in IndexedDB:", e)

				setState(before)
			} finally {
				flushMutex.release()
			}
		},
		[key]
	)

	const retrieve = useCallback(async () => {
		if (didRetrieveRef.current) {
			return
		}

		didRetrieveRef.current = true

		await flushMutex.acquire()

		try {
			const value = await idb.get<T>(key)

			if (value) {
				setState(value)
				setLoaded(true)
			}
		} catch (e) {
			console.error("Error fetching value from IndexedDB:", e)
		} finally {
			flushMutex.release()
		}
	}, [key])

	const set = useCallback(
		(fn: T | ((prev: T) => void)): void => {
			const before = state
			const now = typeof fn === "function" ? (fn as (prev: T) => T)(before) : fn

			setState(now)
			flush(before, now)
		},
		[state, flush]
	)

	useEffect(() => {
		retrieve()

		const kvChangeSubscription = events.subscribe("kvChange", payload => {
			if (payload.key === key) {
				setState(payload.value)
			}
		})

		const kvDeleteSubscription = events.subscribe("kvDelete", payload => {
			if (payload.key === key) {
				setState(initialValue)
			}
		})

		const kvClearSubscription = events.subscribe("kvClear", () => {
			setState(initialValue)
		})

		return () => {
			kvChangeSubscription.remove()
			kvDeleteSubscription.remove()
			kvClearSubscription.remove()
		}
	}, [key, initialValue, retrieve])

	return [state, set, loaded]
}

export default useIdb
