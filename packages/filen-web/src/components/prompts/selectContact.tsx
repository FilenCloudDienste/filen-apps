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
import type { ContactTagged } from "@/queries/useContacts.query"
import ContactsList from "../contacts/list"
import { create } from "zustand"
import { useShallow } from "zustand/shallow"

export type SelectContactPromptParams = {
	title?: string
	description?: string
	cancelText?: string
	confirmText?: string
	onSubmit?: (contacts: ContactTagged[]) => Promise<void> | void
	multiple?: boolean
}

export type SelectContactPromptResponse =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
			contacts: ContactTagged[]
			usedOnSubmit: boolean
	  }

export type SelectContactPromptEvent =
	| {
			type: "request"
			id: string
			params?: SelectContactPromptParams
	  }
	| {
			type: "response"
			id: string
			data: SelectContactPromptResponse
	  }

export type SelectContactPromptStore = {
	selected: ContactTagged[]
	multiple: boolean
	setMultiple: (fn: boolean | ((prev: boolean) => boolean)) => void
	setSelected: (fn: ContactTagged[] | ((prev: ContactTagged[]) => ContactTagged[])) => void
}

export const useSelectContactPromptStore = create<SelectContactPromptStore>(set => ({
	selected: [],
	multiple: false,
	setMultiple(fn) {
		set(state => ({
			multiple: typeof fn === "function" ? fn(state.multiple) : fn
		}))
	},
	setSelected(fn) {
		set(state => ({
			selected: typeof fn === "function" ? fn(state.selected) : fn
		}))
	}
}))

export async function selectContactPrompt(params: SelectContactPromptParams): Promise<SelectContactPromptResponse> {
	return await new Promise<SelectContactPromptResponse>(resolve => {
		const id = globalThis.crypto.randomUUID()

		const subscription = events.subscribe("selectContactPrompt", e => {
			if (e.type === "response" && e.id === id) {
				subscription.remove()

				resolve(e.data)
			}
		})

		events.emit("selectContactPrompt", {
			type: "request",
			id,
			params
		})
	})
}

export const SelectContactPrompt = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const idRef = useRef<string>("")
	const [params, setParams] = useState<SelectContactPromptParams>({})
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const selected = useSelectContactPromptStore(useShallow(state => state.selected))

	const submit = useCallback(
		async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.preventDefault()
			e.stopPropagation()

			if (params.onSubmit) {
				setLoading(true)

				try {
					await params.onSubmit(selected)
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

			events.emit("selectContactPrompt", {
				type: "response",
				id: idRef.current,
				data: {
					cancelled: false,
					contacts: selected,
					usedOnSubmit: Boolean(params.onSubmit)
				}
			})

			setOpen(false)
		},
		[params, selected]
	)

	const cancel = useCallback(() => {
		events.emit("selectContactPrompt", {
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
		const subscription = events.subscribe("selectContactPrompt", e => {
			if (e.type === "request") {
				idRef.current = e.id

				useSelectContactPromptStore.getState().setSelected([])
				useSelectContactPromptStore.getState().setMultiple(e.params?.multiple ?? false)

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
				<div className="w-full h-[calc(50dvh)] flex flex-1 flex-col overflow-hidden">
					<ContactsList
						from="select"
						type="all"
					/>
				</div>
				{error && <p className="text-sm text-red-500 mt-4">{error}</p>}
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
								disabled={loading || selected.length === 0}
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

SelectContactPrompt.displayName = "SelectContactPrompt"

export default SelectContactPrompt
