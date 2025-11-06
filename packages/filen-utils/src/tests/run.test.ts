import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { run, runAbortable, runEffect, runRetry, runTimeout, runDebounced, AbortError, TimeoutError } from "../run"

describe("run", () => {
	describe("basic functionality", () => {
		it("should return success result when function succeeds", async () => {
			const result = await run(async () => {
				return "success"
			})

			expect(result).toEqual({
				success: true,
				data: "success",
				error: null
			})
		})

		it("should return failure result when function throws", async () => {
			const result = await run(async () => {
				throw new Error("failed")
			})

			expect(result).toEqual({
				success: false,
				data: null,
				error: expect.any(Error)
			})
			expect(result.success === false && result.error.message).toBe("failed")
		})

		it("should work with synchronous functions", async () => {
			const result = await run(() => {
				return 42
			})

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe(42)
		})

		it("should convert non-Error throws to Error", async () => {
			const result = await run(async () => {
				throw "string error"
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(Error)
			expect(result.success === false && result.error.message).toBe("Unknown error")
		})
	})

	describe("defer functionality", () => {
		it("should execute deferred functions in LIFO order", async () => {
			const order: number[] = []

			await run(async defer => {
				defer(() => order.push(1))
				defer(() => order.push(2))
				defer(() => order.push(3))

				return "done"
			})

			expect(order).toEqual([3, 2, 1])
		})

		it("should execute deferred functions even when main function throws", async () => {
			const cleanup = vi.fn()

			await run(async defer => {
				defer(cleanup)

				throw new Error("failed")
			})

			expect(cleanup).toHaveBeenCalledOnce()
		})

		it("should handle async deferred functions", async () => {
			const order: number[] = []

			await run(async defer => {
				defer(async () => {
					await new Promise(resolve => setTimeout(resolve, 10))

					order.push(1)
				})

				defer(async () => {
					await new Promise(resolve => setTimeout(resolve, 5))

					order.push(2)
				})

				return "done"
			})

			expect(order).toEqual([2, 1])
		})

		it("should catch errors in deferred functions", async () => {
			const onError = vi.fn()

			await run(
				async defer => {
					defer(() => {
						throw new Error("cleanup failed")
					})

					return "done"
				},
				{
					onError
				}
			)

			expect(onError).toHaveBeenCalledWith(expect.any(Error))
		})

		it("should continue executing other deferred functions if one fails", async () => {
			const cleanup1 = vi.fn()
			const cleanup2 = vi.fn()

			await run(async defer => {
				defer(() => cleanup1())

				defer(() => {
					throw new Error("middle cleanup failed")
				})

				defer(() => cleanup2())

				return "done"
			})

			expect(cleanup1).toHaveBeenCalled()
			expect(cleanup2).toHaveBeenCalled()
		})
	})

	describe("options", () => {
		it("should call onError when function throws", async () => {
			const onError = vi.fn()
			const error = new Error("test error")

			await run(
				async () => {
					throw error
				},
				{
					onError
				}
			)

			expect(onError).toHaveBeenCalledWith(error)
		})

		it("should throw error when throw option is true", async () => {
			await expect(
				run(
					async () => {
						throw new Error("test error")
					},
					{
						throw: true
					}
				)
			).rejects.toThrow("test error")
		})

		it("should still execute cleanup before throwing", async () => {
			const cleanup = vi.fn()

			await expect(
				run(
					async defer => {
						defer(() => cleanup())

						throw new Error("test error")
					},
					{
						throw: true
					}
				)
			).rejects.toThrow()

			expect(cleanup).toHaveBeenCalled()
		})
	})

	describe("real-world scenarios", () => {
		it("should handle file operations", async () => {
			const file = {
				close: vi.fn()
			}

			const openFile = vi.fn().mockResolvedValue(file)
			const readFile = vi.fn().mockResolvedValue("content")

			const result = await run(async defer => {
				const f = await openFile("test.txt")

				defer(() => f.close())

				const content = await readFile(f)

				return content
			})

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe("content")
			expect(file.close).toHaveBeenCalled()
		})

		it("should handle database transactions", async () => {
			const connection = {
				close: vi.fn(),
				beginTransaction: vi.fn(),
				commit: vi.fn(),
				rollback: vi.fn()
			}

			const db = {
				connect: vi.fn().mockResolvedValue(connection)
			}

			await run(async defer => {
				const conn = await db.connect()

				defer(() => conn.close())

				await conn.beginTransaction()

				defer(() => conn.rollback())

				await conn.commit()
			})

			expect(connection.rollback).toHaveBeenCalled()
			expect(connection.close).toHaveBeenCalled()
		})
	})
})

describe("runAbortable", () => {
	describe("basic functionality", () => {
		it("should provide abort controller and signal", async () => {
			const result = await runAbortable(async ({ signal, controller }) => {
				expect(signal).toBeInstanceOf(AbortSignal)
				expect(controller).toBeInstanceOf(AbortController)

				return "success"
			})

			expect(result.success).toBe(true)
		})

		it("should abort operation when controller.abort() is called", async () => {
			const result = await runAbortable(async ({ abortable, controller }) => {
				setTimeout(() => controller.abort(), 10)

				await abortable(async () => {
					await new Promise(resolve => setTimeout(resolve, 100))
				})

				return "should not reach here"
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(AbortError)
		})

		it("should throw AbortError immediately if already aborted", async () => {
			const controller = new AbortController()

			controller.abort()

			const result = await runAbortable(
				async ({ abortable }) => {
					await abortable(async () => {
						return "work"
					})

					return "done"
				},
				{
					controller
				}
			)

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(AbortError)
		})
	})

	describe("abortable function", () => {
		it("should execute abortable function normally when not aborted", async () => {
			const result = await runAbortable(async ({ abortable }) => {
				const value = await abortable(async () => {
					return 42
				})

				return value
			})

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe(42)
		})

		it("should reject abortable when signal is aborted during execution", async () => {
			const result = await runAbortable(async ({ abortable, controller }) => {
				const promise = abortable(async () => {
					await new Promise(resolve => setTimeout(resolve, 50))

					return "completed"
				})

				setTimeout(() => controller.abort(), 10)

				return await promise
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(AbortError)
		})

		it("should support custom signal in abortable", async () => {
			const customController = new AbortController()

			const result = await runAbortable(async ({ abortable }) => {
				setTimeout(() => customController.abort(), 10)

				await abortable(
					async () => {
						await new Promise(resolve => setTimeout(resolve, 100))
					},
					{
						signal: customController.signal
					}
				)

				return "done"
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(AbortError)
		})
	})

	describe("defer with abort", () => {
		it("should execute deferred cleanup even when aborted", async () => {
			const cleanup = vi.fn()

			const result = await runAbortable(async ({ abortable, defer, controller }) => {
				defer(() => cleanup())

				setTimeout(() => controller.abort(), 10)

				await abortable(async () => {
					await new Promise(resolve => setTimeout(resolve, 100))
				})

				return "done"
			})

			expect(result.success).toBe(false)
			expect(cleanup).toHaveBeenCalled()
		})
	})

	describe("options", () => {
		it("should accept external controller", async () => {
			const externalController = new AbortController()

			const result = await runAbortable(
				async ({ controller }) => {
					expect(controller).toBe(externalController)

					return "done"
				},
				{
					controller: externalController
				}
			)

			expect(result.success).toBe(true)
		})

		it("should accept external signal", async () => {
			const externalController = new AbortController()

			const result = await runAbortable(
				async ({ signal }) => {
					expect(signal).toBe(externalController.signal)

					return "done"
				},
				{
					signal: externalController.signal
				}
			)

			expect(result.success).toBe(true)
		})
	})
})

describe("runEffect", () => {
	describe("basic functionality", () => {
		it("should return result with cleanup function", () => {
			const result = runEffect(() => {
				return "success"
			})

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe("success")
			expect(result.cleanup).toBeInstanceOf(Function)
		})

		it("should execute cleanup when called manually", () => {
			const cleanup1 = vi.fn()
			const cleanup2 = vi.fn()

			const result = runEffect(defer => {
				defer(() => cleanup1())
				defer(() => cleanup2())

				return "done"
			})

			expect(cleanup1).not.toHaveBeenCalled()
			expect(cleanup2).not.toHaveBeenCalled()

			result.cleanup()

			expect(cleanup1).toHaveBeenCalled()
			expect(cleanup2).toHaveBeenCalled()
		})

		it("should execute deferred functions in LIFO order", () => {
			const order: number[] = []

			const result = runEffect(defer => {
				defer(() => order.push(1))
				defer(() => order.push(2))
				defer(() => order.push(3))

				return "done"
			})

			result.cleanup()

			expect(order).toEqual([3, 2, 1])
		})
	})

	describe("automatic cleanup", () => {
		it("should automatically cleanup when automaticCleanup is true", () => {
			const cleanup = vi.fn()

			runEffect(
				defer => {
					defer(() => cleanup())

					return "done"
				},
				{
					automaticCleanup: true
				}
			)

			expect(cleanup).toHaveBeenCalled()
		})

		it("should not automatically cleanup when automaticCleanup is false", () => {
			const cleanup = vi.fn()

			runEffect(
				defer => {
					defer(() => cleanup())
					return "done"
				},
				{
					automaticCleanup: false
				}
			)

			expect(cleanup).not.toHaveBeenCalled()
		})
	})

	describe("error handling", () => {
		it("should return error result when function throws", () => {
			const result = runEffect(() => {
				throw new Error("failed")
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error.message).toBe("failed")
		})

		it("should still provide cleanup function on error", () => {
			const cleanup = vi.fn()

			const result = runEffect(defer => {
				defer(() => cleanup())

				throw new Error("failed")
			})

			expect(result.cleanup).toBeInstanceOf(Function)

			result.cleanup()

			expect(cleanup).toHaveBeenCalled()
		})
	})
})

describe("runRetry", () => {
	describe("basic functionality", () => {
		it("should succeed on first attempt", async () => {
			const fn = vi.fn().mockResolvedValue("success")

			const result = await runRetry(async () => {
				return fn()
			})

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe("success")
			expect(fn).toHaveBeenCalledOnce()
		})

		it("should retry on failure and eventually succeed", async () => {
			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error("fail 1"))
				.mockRejectedValueOnce(new Error("fail 2"))
				.mockResolvedValue("success")

			const result = await runRetry(
				async () => {
					return fn()
				},
				{
					maxAttempts: 3,
					delayMs: 10
				}
			)

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe("success")
			expect(fn).toHaveBeenCalledTimes(3)
		})

		it("should fail after max attempts", async () => {
			const fn = vi.fn().mockRejectedValue(new Error("persistent failure"))

			const result = await runRetry(async () => fn(), {
				maxAttempts: 3,
				delayMs: 10
			})

			expect(result.success).toBe(false)
			expect(result.success === false && result.error.message).toBe("persistent failure")
			expect(fn).toHaveBeenCalledTimes(3)
		})

		it("should pass attempt number to function", async () => {
			const attempts: number[] = []

			await runRetry(
				async (_, attempt) => {
					attempts.push(attempt)

					if (attempt < 3) {
						throw new Error("retry")
					}

					return "done"
				},
				{
					maxAttempts: 3,
					delayMs: 10
				}
			)

			expect(attempts).toEqual([1, 2, 3])
		})
	})

	describe("shouldRetry option", () => {
		it("should respect shouldRetry boolean", async () => {
			const fn = vi.fn().mockRejectedValue(new Error("fail"))

			const result = await runRetry(async () => fn(), {
				maxAttempts: 3,
				delayMs: 10,
				shouldRetry: false
			})

			expect(result.success).toBe(false)
			expect(fn).toHaveBeenCalledOnce()
		})

		it("should respect shouldRetry function", async () => {
			const fn = vi.fn().mockRejectedValue(new Error("FATAL"))

			const result = await runRetry(async () => fn(), {
				maxAttempts: 5,
				delayMs: 10,
				shouldRetry: error => {
					return !error.message.includes("FATAL")
				}
			})

			expect(result.success).toBe(false)
			expect(fn).toHaveBeenCalledOnce()
		})

		it("should call shouldRetry with error and attempt", async () => {
			const shouldRetry = vi.fn().mockReturnValue(false)

			await runRetry(
				async () => {
					throw new Error("test")
				},
				{
					maxAttempts: 3,
					delayMs: 10,
					shouldRetry
				}
			)

			expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 1)
		})
	})

	describe("onRetry callback", () => {
		it("should call onRetry before each retry", async () => {
			const onRetry = vi.fn()

			await runRetry(
				async (_, attempt) => {
					if (attempt < 3) {
						throw new Error(`fail ${attempt}`)
					}

					return "success"
				},
				{
					maxAttempts: 3,
					delayMs: 10,
					onRetry
				}
			)

			expect(onRetry).toHaveBeenCalledTimes(2)
			expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1)
			expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2)
		})
	})

	describe("defer in retry", () => {
		it("should execute defer cleanup on each attempt", async () => {
			const cleanups: number[] = []

			await runRetry(
				async (defer, attempt) => {
					defer(() => cleanups.push(attempt))

					if (attempt < 3) {
						throw new Error("retry")
					}

					return "done"
				},
				{
					maxAttempts: 3,
					delayMs: 10
				}
			)

			expect(cleanups).toEqual([1, 2, 3])
		})
	})
})

describe("runTimeout", () => {
	describe("basic functionality", () => {
		it("should succeed when function completes before timeout", async () => {
			const result = await runTimeout(async () => {
				await new Promise(resolve => setTimeout(resolve, 10))

				return "success"
			}, 100)

			expect(result.success).toBe(true)
			expect(result.success && result.data).toBe("success")
		})

		it("should timeout when function takes too long", async () => {
			const result = await runTimeout(async () => {
				await new Promise(resolve => setTimeout(resolve, 100))

				return "should not complete"
			}, 20)

			expect(result.success).toBe(false)
			expect(result.success === false && result.error).toBeInstanceOf(TimeoutError)
			expect(result.success === false && result.error.message).toContain("20ms")
		})

		it("should throw when throw option is true", async () => {
			await expect(
				runTimeout(
					async () => {
						await new Promise(resolve => setTimeout(resolve, 100))

						return "done"
					},
					20,
					{
						throw: true
					}
				)
			).rejects.toThrow(TimeoutError)
		})
	})

	describe("cleanup", () => {
		it("should execute deferred cleanup even on timeout", async () => {
			const cleanup = vi.fn()

			await runTimeout(async defer => {
				defer(() => cleanup())

				await new Promise(resolve => setTimeout(resolve, 100))

				return "done"
			}, 20)

			await new Promise(resolve => setTimeout(resolve, 100))

			expect(cleanup).toHaveBeenCalled()
		})
	})

	describe("error handling", () => {
		it("should call onError on timeout", async () => {
			const onError = vi.fn()

			await runTimeout(
				async () => {
					await new Promise(resolve => setTimeout(resolve, 100))

					return "done"
				},
				20,
				{
					onError
				}
			)

			expect(onError).toHaveBeenCalledWith(expect.any(TimeoutError))
		})

		it("should handle errors from function itself", async () => {
			const result = await runTimeout(async () => {
				throw new Error("function error")
			}, 100)

			expect(result.success).toBe(false)
			expect(result.success === false && result.error.message).toBe("function error")
		})
	})
})

describe("runDebounced", () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe("defer support", () => {
		it("should support defer in debounced function", async () => {
			const cleanup = vi.fn()

			const debounced = runDebounced(async defer => {
				defer(() => cleanup())

				return "done"
			}, 100)

			const promise = debounced()

			vi.advanceTimersByTime(100)

			await promise

			expect(cleanup).toHaveBeenCalled()
		})
	})

	describe("error handling", () => {
		it("should call onError when provided", async () => {
			const onError = vi.fn()

			const debounced = runDebounced(
				async () => {
					throw new Error("test")
				},
				100,
				{
					onError
				}
			)

			const promise = debounced()

			vi.advanceTimersByTime(100)

			await promise

			expect(onError).toHaveBeenCalledWith(expect.any(Error))
		})
	})
})

describe("integration tests", () => {
	it("should nest multiple defer levels", async () => {
		const order: string[] = []

		await run(async defer1 => {
			defer1(() => order.push("outer-1"))

			await run(async defer2 => {
				defer2(() => order.push("inner-1"))
				defer2(() => order.push("inner-2"))
			})

			defer1(() => order.push("outer-2"))
		})

		expect(order).toEqual(["inner-2", "inner-1", "outer-2", "outer-1"])
	})
})
