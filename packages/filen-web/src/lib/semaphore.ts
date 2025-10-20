export class DisposeSemaphoreWrapper implements AsyncDisposable {
	private readonly semaphore: Semaphore
	private released: boolean = false

	public constructor(semaphore: Semaphore) {
		this.semaphore = semaphore
	}

	async [Symbol.asyncDispose](): Promise<void> {
		if (this.released) {
			return Promise.resolve()
		}

		this.semaphore.release()

		this.released = true

		return Promise.resolve()
	}
}

export class Semaphore {
	private counter: number = 0
	private waiting: Array<{
		resolve: (value: DisposeSemaphoreWrapper | PromiseLike<DisposeSemaphoreWrapper>) => void
		reject: (reason?: unknown) => void
	}> = []
	private maxCount: number

	public constructor(max: number = 1) {
		if (max < 1) {
			throw new Error("Max must be at least 1")
		}

		this.maxCount = max
	}

	public acquire(): Promise<DisposeSemaphoreWrapper> {
		if (this.counter < this.maxCount) {
			this.counter++

			return Promise.resolve(new DisposeSemaphoreWrapper(this))
		} else {
			return new Promise<DisposeSemaphoreWrapper>((resolve, reject) => {
				this.waiting.push({
					resolve,
					reject
				})
			})
		}
	}

	public release(): void {
		if (this.counter <= 0) {
			return
		}

		this.counter--

		this.processQueue()
	}

	private processQueue(): void {
		if (this.waiting.length > 0 && this.counter < this.maxCount) {
			this.counter++

			const waiter = this.waiting.shift()

			if (waiter) {
				waiter.resolve(new DisposeSemaphoreWrapper(this))
			}
		}
	}
}

export class Mutex {
	private semaphore: Semaphore = new Semaphore(1)

	public acquire(): Promise<DisposeSemaphoreWrapper> {
		return this.semaphore.acquire()
	}

	public release(): void {
		this.semaphore.release()
	}
}

export default Semaphore
