import { toast } from "sonner"

export class Toasts {
	public success(message: string): void {
		toast.success(message)
	}

	public error(e: unknown | Error | string): void {
		if (e instanceof Error && e.message.trim().toLowerCase() === "cancelled") {
			return
		}

		toast.error(e instanceof Error ? e.message : typeof e === "string" ? e : "An unknown error occurred")
	}

	public info(message: string): void {
		toast.info(message)
	}

	public loading(message?: string): {
		dismiss: () => void
		error: (e: unknown | Error | string) => void
		success: (msg: string) => void
	} {
		const id = toast.loading(message)
		let dismissed = false

		return {
			dismiss: () => {
				if (dismissed) {
					return
				}

				dismissed = true

				this.dismiss(id)
			},
			error: (e: unknown | Error | string) => {
				this.error(e)

				setTimeout(() => {
					this.dismiss(id)
				}, 1)
			},
			success: (msg: string) => {
				this.success(msg)

				setTimeout(() => {
					this.dismiss(id)
				}, 1)
			}
		}
	}

	public dismiss(id?: string | number): void {
		toast.dismiss(id)
	}
}

export const toasts = new Toasts()

export default toasts
