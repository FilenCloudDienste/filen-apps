import { EventEmitter } from "eventemitter3"
import type { InputPromptEvent } from "@/components/prompts/input"
import type { SelectDriveItemsEvent } from "@/components/prompts/selectDriveItem"

export type Events = {
	kvChange: {
		key: string
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		value: any
	}
	kvDelete: {
		key: string
	}
	kvClear: void
	inputPrompt: InputPromptEvent
	selectDriveItemPrompt: SelectDriveItemsEvent
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
