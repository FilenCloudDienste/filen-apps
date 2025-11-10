import { EventEmitter } from "eventemitter3"

export type Events = {
	secureStoreChange: {
		key: string
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any
	}
	secureStoreRemove: {
		key: string
	}
	secureStoreClear: void
	showFullScreenLoadingModal: void
	hideFullScreenLoadingModal: void
	forceHideFullScreenLoadingModal: void
}

export class TypedEventEmitter<T> {
	private readonly emitter = new EventEmitter()

	public subscribe<K extends keyof T>(event: K, listener: (payload: T[K]) => void) {
		this.emitter.addListener(event as string, listener)

		return {
			remove: () => {
				this.emitter.removeListener(event as string, listener)
			}
		}
	}

	public emit<K extends keyof T>(event: K, payload?: T[K]): boolean {
		return this.emitter.emit(event as string, payload)
	}

	public on<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
		this.emitter.on(event as string, listener)

		return this
	}

	public once<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
		this.emitter.once(event as string, listener)

		return this
	}

	public off<K extends keyof T>(event: K, listener: (payload: T[K]) => void): this {
		this.emitter.off(event as string, listener)

		return this
	}
}

export const events = new TypedEventEmitter<Events>()

export default events
