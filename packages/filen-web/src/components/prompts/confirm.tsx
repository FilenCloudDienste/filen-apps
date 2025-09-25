import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import events from "@/lib/events"
import { LoaderIcon } from "lucide-react"

export type ConfirmPromptParams = {
	title?: string
	description?: string
	cancelText?: string
	confirmText?: string
	confirmDestructive?: boolean
	onSubmit?: () => Promise<void> | void
}

export type ConfirmPromptResponse =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
			usedOnSubmit: boolean
	  }

export type ConfirmPromptEvent =
	| {
			type: "request"
			id: string
			params?: ConfirmPromptParams
	  }
	| {
			type: "response"
			id: string
			data: ConfirmPromptResponse
	  }

export async function confirmPrompt(params: ConfirmPromptParams): Promise<ConfirmPromptResponse> {
	return await new Promise<ConfirmPromptResponse>(resolve => {
		const id = globalThis.crypto.randomUUID()

		const subscription = events.subscribe("confirmPrompt", e => {
			if (e.type === "response" && e.id === id) {
				subscription.remove()

				resolve(e.data)
			}
		})

		events.emit("confirmPrompt", {
			type: "request",
			id,
			params
		})
	})
}

export const ConfirmPrompt = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const idRef = useRef<string>("")
	const [params, setParams] = useState<ConfirmPromptParams>({})
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const submit = useCallback(
		async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.preventDefault()
			e.stopPropagation()

			if (params.onSubmit) {
				setLoading(true)

				try {
					await params.onSubmit()
				} catch (e) {
					console.error(e)

					if (e instanceof Error) {
						setError(e.message)
					} else {
						setError("An unknown error occurred")
					}

					return
				} finally {
					setLoading(false)
				}
			}

			events.emit("confirmPrompt", {
				type: "response",
				id: idRef.current,
				data: {
					cancelled: false,
					usedOnSubmit: Boolean(params.onSubmit)
				}
			})

			setOpen(false)
		},
		[params]
	)

	const cancel = useCallback(() => {
		events.emit("confirmPrompt", {
			type: "response",
			id: idRef.current,
			data: {
				cancelled: true
			}
		})
	}, [])

	const onOpenChange = useCallback(
		(isOpen: boolean) => {
			if (loading) {
				return
			}

			setOpen(isOpen)

			if (!isOpen) {
				cancel()
			}
		},
		[cancel, loading]
	)

	useEffect(() => {
		const subscription = events.subscribe("confirmPrompt", e => {
			if (e.type === "request") {
				idRef.current = e.id

				setParams(e.params ?? {})
				setError(null)
				setLoading(false)
				setOpen(true)
			}
		})

		return () => {
			subscription.remove()
		}
	}, [])

	return (
		<AlertDialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					{params.title && <AlertDialogTitle>{params.title}</AlertDialogTitle>}
					{params.description && <AlertDialogDescription>{params.description}</AlertDialogDescription>}
				</AlertDialogHeader>
				{error && <p className="text-sm text-destructive">{error}</p>}
				{(params.cancelText || params.confirmText) && (
					<AlertDialogFooter>
						{params.cancelText && (
							<AlertDialogCancel
								onClick={cancel}
								disabled={loading}
							>
								{params.cancelText}
							</AlertDialogCancel>
						)}
						{params.confirmText && (
							<AlertDialogAction
								onClick={submit}
								disabled={loading}
								variant={params.confirmDestructive ? "destructive" : "default"}
							>
								{loading ? <LoaderIcon className="animate-spin" /> : params.confirmText}
							</AlertDialogAction>
						)}
					</AlertDialogFooter>
				)}
			</AlertDialogContent>
		</AlertDialog>
	)
})

ConfirmPrompt.displayName = "ConfirmPrompt"

export default ConfirmPrompt
