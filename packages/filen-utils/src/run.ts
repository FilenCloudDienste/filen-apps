export type Success<T> = {
	success: true
	data: T
	error: null
}

export type Failure<E = Error> = {
	success: false
	data: null
	error: E
}

export type Result<T, E = Error> = Success<T> | Failure<E>

export type GenericFnResult =
	| number
	| boolean
	| string
	| object
	| null
	| undefined
	| symbol
	| bigint
	| void
	| Promise<number | boolean | string | object | null | undefined | symbol | bigint | void>
	| Array<number | boolean | string | object | null | undefined | symbol | bigint | void>
export type DeferFn = (fn: () => GenericFnResult) => void
export type DeferredFunction = () => GenericFnResult
export type DeferredFunctions = Array<DeferredFunction>

export type Options = {
	throw?: boolean
	onError?: (err: Error) => void
}

export async function run<TResult, E = Error>(
	fn: (deferFn: DeferFn) => Promise<TResult> | TResult,
	options?: Options
): Promise<Result<TResult, E>> {
	const deferredFunctions: DeferredFunctions = []

	const defer: DeferFn = deferFn => {
		deferredFunctions.push(deferFn)
	}

	try {
		const result = await fn(defer)

		return {
			success: true,
			data: result,
			error: null
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error("Unknown error")

		options?.onError?.(error)

		if (options?.throw) {
			throw error
		}

		return {
			success: false,
			data: null,
			error: error as E
		}
	} finally {
		// Needs to be LIFO to properly clean up resources and not interfere with each other and cause race conditions
		for (let i = deferredFunctions.length - 1; i >= 0; i--) {
			try {
				await deferredFunctions[i]?.()
			} catch (e) {
				options?.onError?.(e instanceof Error ? e : new Error("Unknown error"))
			}
		}
	}
}

export type AbortableFn = (
	abortableFn: () => GenericFnResult,
	opts?: {
		signal?: AbortSignal
	}
) => GenericFnResult

export class AbortError extends Error {
	public constructor(message = "Operation aborted") {
		super(message)

		this.name = "AbortError"
	}
}

export function abortSignalReason(signal: AbortSignal): string | undefined {
	try {
		if (signal.reason instanceof Error) {
			return signal.reason.message
		} else if (typeof signal.reason === "string") {
			return signal.reason
		} else if (signal.reason !== undefined) {
			return String(signal.reason)
		}

		return undefined
	} catch {
		return undefined
	}
}

export async function runAbortable<TResult, E = Error>(
	fn: ({
		abortable,
		defer,
		signal,
		controller
	}: {
		abortable: AbortableFn
		defer: DeferFn
		signal: AbortSignal
		controller: AbortController
	}) => Promise<TResult> | TResult,
	options?: Options & {
		controller?: AbortController
		signal?: AbortSignal
	}
): Promise<Result<TResult, E>> {
	const deferredFunctions: DeferredFunctions = []
	const controller = options?.controller ?? new AbortController()
	const signal = options?.signal ?? options?.controller?.signal ?? controller.signal

	const defer: DeferFn = deferFn => {
		deferredFunctions.push(deferFn)
	}

	const abortable: AbortableFn = async <T>(
		abortableFn: () => Promise<T> | T,
		opts?: {
			signal?: AbortSignal
		}
	): Promise<T> => {
		if (signal.aborted) {
			throw new AbortError(abortSignalReason(signal))
		}

		return await new Promise<T>((resolve, reject) => {
			;(async () => {
				const signal = opts?.signal ?? controller.signal

				const abortHandler = () => {
					reject(new AbortError(abortSignalReason(signal)))
				}

				signal.addEventListener("abort", abortHandler)

				try {
					if (signal.aborted) {
						reject(new AbortError(abortSignalReason(signal)))

						return
					}

					const result = await abortableFn()

					if (signal.aborted) {
						reject(new AbortError(abortSignalReason(signal)))

						return
					}

					resolve(result)
				} catch (error) {
					reject(error)
				} finally {
					signal.removeEventListener("abort", abortHandler)
				}
			})()
		})
	}

	try {
		if (signal.aborted) {
			throw new AbortError(abortSignalReason(signal))
		}

		const result = await fn({
			abortable,
			defer,
			signal,
			controller
		})

		if (signal.aborted) {
			throw new AbortError(abortSignalReason(signal))
		}

		return {
			success: true,
			data: result,
			error: null
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error("Unknown error")

		options?.onError?.(error)

		if (options?.throw) {
			throw error
		}

		return {
			success: false,
			data: null,
			error: error as E
		}
	} finally {
		// Needs to be LIFO to properly clean up resources
		for (let i = deferredFunctions.length - 1; i >= 0; i--) {
			try {
				await deferredFunctions[i]?.()
			} catch (e) {
				options?.onError?.(e instanceof Error ? e : new Error("Unknown error"))
			}
		}
	}
}

export function runEffect<TResult, E = Error>(
	fn: (deferFn: DeferFn) => TResult,
	options?: Options & {
		automaticCleanup?: boolean
	}
): Result<TResult, E> & {
	cleanup: () => void
} {
	const deferredFunctions: DeferredFunctions = []

	const defer: DeferFn = deferFn => {
		deferredFunctions.push(deferFn)
	}

	const cleanup = () => {
		for (let i = deferredFunctions.length - 1; i >= 0; i--) {
			try {
				deferredFunctions[i]?.()
			} catch (e) {
				options?.onError?.(e instanceof Error ? e : new Error("Unknown error"))
			}
		}
	}

	try {
		const result = fn(defer)

		return {
			success: true,
			data: result,
			error: null,
			cleanup
		}
	} catch (e) {
		const error = e instanceof Error ? e : new Error("Unknown error")

		options?.onError?.(error)

		if (options?.throw) {
			throw error
		}

		return {
			success: false,
			data: null,
			error: error as E,
			cleanup
		}
	} finally {
		if (options?.automaticCleanup) {
			cleanup()
		}
	}
}

export async function runRetry<TResult, E = Error>(
	fn: (deferFn: DeferFn, attempt: number) => Promise<TResult> | TResult,
	options?: Options & {
		maxAttempts?: number
		delayMs?: number
		backoff?: "linear" | "exponential"
		shouldRetry?: ((err: E, attempt: number) => boolean) | boolean
		onRetry?: (err: E, attempt: number) => void
	}
): Promise<Result<TResult, E>> {
	const maxAttempts = options?.maxAttempts ?? 3
	const delayMs = options?.delayMs ?? 1000
	const backoff = options?.backoff ?? "exponential"
	let lastError: E | null = null

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const result = await run<TResult, E>(defer => fn(defer, attempt), {
			...options,
			throw: false
		})

		if (result.success) {
			return result
		}

		lastError = result.error

		if (attempt < maxAttempts) {
			const shouldRetry =
				typeof options?.shouldRetry === "boolean"
					? options.shouldRetry
					: options && typeof options.shouldRetry === "function"
						? options.shouldRetry(result.error, attempt)
						: true

			if (!shouldRetry) {
				break
			}

			options?.onRetry?.(result.error, attempt)

			const delay = backoff === "exponential" ? delayMs * Math.pow(2, attempt - 1) : delayMs * attempt

			await new Promise<void>(resolve => setTimeout(resolve, delay))
		}
	}

	return {
		success: false,
		data: null,
		error: lastError as E
	}
}

export class TimeoutError extends Error {
	public constructor(message = "Operation timed out") {
		super(message)

		this.name = "TimeoutError"
	}
}

export async function runTimeout<TResult, E = Error>(
	fn: (deferFn: DeferFn) => Promise<TResult> | TResult,
	timeoutMs: number,
	options?: Options
): Promise<Result<TResult, E>> {
	const controller = new AbortController()

	try {
		const result = await Promise.race([
			run(fn, options),
			new Promise<never>((_, reject) => {
				const timeoutId = setTimeout(() => {
					controller.abort()

					reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`))
				}, timeoutMs)

				controller.signal.addEventListener("abort", () => clearTimeout(timeoutId))
			})
		])

		return result as Result<TResult, E>
	} catch (e) {
		const error = e instanceof Error ? e : new Error("Unknown error")

		options?.onError?.(error)

		if (options?.throw) {
			throw error
		}

		return {
			success: false,
			data: null,
			error: error as E
		}
	}
}

export function runDebounced<TResult, TArgs extends unknown[]>(
	fn: (defer: DeferFn, ...args: TArgs) => Promise<TResult> | TResult,
	delayMs: number,
	options?: Options
): (...args: TArgs) => Promise<Result<TResult, Error>> {
	let timeoutId: NodeJS.Timeout | null = null
	let pendingPromise: Promise<Result<TResult, Error>> | null = null

	return (...args: TArgs) => {
		if (timeoutId) {
			clearTimeout(timeoutId)
		}

		if (!pendingPromise) {
			pendingPromise = new Promise(resolve => {
				timeoutId = setTimeout(async () => {
					const result = await run(defer => fn(defer, ...args), options)

					resolve(result)

					pendingPromise = null
					timeoutId = null
				}, delayMs)
			})
		}

		return pendingPromise
	}
}

export default run
