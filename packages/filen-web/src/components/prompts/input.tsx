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
import { Input } from "../ui/input"
import { LoaderIcon } from "lucide-react"

export type InputPromptParams = {
	title?: string
	description?: string
	cancelText?: string
	confirmText?: string
	inputProps?: React.ComponentProps<typeof Input>
	onSubmit?: (value: string) => Promise<void> | void
}

export type InputPromptResponse =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
			value: string
			usedOnSubmit: boolean
	  }

export type InputPromptEvent =
	| {
			type: "request"
			id: string
			params?: InputPromptParams
	  }
	| {
			type: "response"
			id: string
			data: InputPromptResponse
	  }

export async function inputPrompt(params: InputPromptParams): Promise<InputPromptResponse> {
	return await new Promise<InputPromptResponse>(resolve => {
		const id = globalThis.crypto.randomUUID()

		const subscription = events.subscribe("inputPrompt", e => {
			if (e.type === "response" && e.id === id) {
				subscription.remove()

				resolve(e.data)
			}
		})

		events.emit("inputPrompt", {
			type: "request",
			id,
			params
		})
	})
}

export const InputPrompt = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const idRef = useRef<string>("")
	const [params, setParams] = useState<InputPromptParams>({})
	const [value, setValue] = useState<string>("")
	const inputRef = useRef<HTMLInputElement>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const submit = useCallback(
		async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.preventDefault()
			e.stopPropagation()

			if (params.onSubmit) {
				setLoading(true)

				try {
					await params.onSubmit(value)
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

			events.emit("inputPrompt", {
				type: "response",
				id: idRef.current,
				data: {
					cancelled: false,
					value,
					usedOnSubmit: Boolean(params.onSubmit)
				}
			})

			setOpen(false)
		},
		[value, params]
	)

	const cancel = useCallback(() => {
		events.emit("inputPrompt", {
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

	const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value)
	}, [])

	const keyDownListener = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Enter" && open && !loading && value) {
				submit(new MouseEvent("click") as unknown as React.MouseEvent<HTMLButtonElement, MouseEvent>)
			}
		},
		[loading, open, submit, value]
	)

	useEffect(() => {
		globalThis.addEventListener("keydown", keyDownListener)

		return () => {
			globalThis.removeEventListener("keydown", keyDownListener)
		}
	}, [keyDownListener])

	useEffect(() => {
		const subscription = events.subscribe("inputPrompt", e => {
			if (e.type === "request") {
				idRef.current = e.id

				setParams(e.params ?? {})
				setValue(e.params?.inputProps?.value?.toString() ?? e.params?.inputProps?.defaultValue?.toString() ?? "")
				setError(null)
				setLoading(false)
				setOpen(true)

				setTimeout(() => {
					inputRef.current?.focus()
				}, 100)
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
				<Input
					{...params.inputProps}
					disabled={loading || params.inputProps?.disabled}
					ref={inputRef}
					value={value}
					onChange={onChange}
				/>
				{error && <p className="text-sm text-red-500">{error}</p>}
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
								disabled={!value || loading}
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

InputPrompt.displayName = "InputPrompt"

export default InputPrompt
