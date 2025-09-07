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
import { memo, useState, useEffect, useCallback, useRef, useMemo } from "react"
import events from "@/lib/events"
import { LoaderIcon } from "lucide-react"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { orderItemsByType } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import DriveListItem from "../drive/list/item"
import { Block } from "@tanstack/react-router"
import pathModule from "path"

export type SelectDriveItemPromptParams = {
	title?: string
	description?: string
	cancelText?: string
	confirmText?: string
	startPath?: string
	onSubmit?: (items: DriveItem[]) => Promise<void> | void
	multiple?: boolean
	types?: ("file" | "directory")[]
}

export type SelectDriveItemsResponse =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
			items: DriveItem[]
			usedOnSubmit: boolean
	  }

export type SelectDriveItemsEvent =
	| {
			type: "request"
			id: string
			params?: SelectDriveItemPromptParams
	  }
	| {
			type: "response"
			id: string
			data: SelectDriveItemsResponse
	  }

export async function selectDriveItemPrompt(params: SelectDriveItemPromptParams): Promise<SelectDriveItemsResponse> {
	return await new Promise<SelectDriveItemsResponse>(resolve => {
		const id = globalThis.crypto.randomUUID()

		const subscription = events.subscribe("selectDriveItemPrompt", e => {
			if (e.type === "response" && e.id === id) {
				subscription.remove()

				resolve(e.data)
			}
		})

		events.emit("selectDriveItemPrompt", {
			type: "request",
			id,
			params
		})
	})
}

export const SelectDriveItemPrompt = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const idRef = useRef<string>("")
	const [params, setParams] = useState<SelectDriveItemPromptParams>({})
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [path, setPath] = useState<string>("/")
	const [selectedItems, setSelectedItems] = useState<DriveItem[]>([])

	const driveItemsQuery = useDriveItemsQuery(
		{
			path
		},
		{
			enabled: open
		}
	)

	const items = useMemo(() => {
		if (driveItemsQuery.status !== "success") {
			return []
		}

		return orderItemsByType({
			items: driveItemsQuery.data,
			type: "nameAsc"
		})
	}, [driveItemsQuery.status, driveItemsQuery.data])

	const submit = useCallback(
		async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
			e.preventDefault()
			e.stopPropagation()

			if (params.onSubmit) {
				setLoading(true)

				try {
					await params.onSubmit(selectedItems)
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

			events.emit("selectDriveItemPrompt", {
				type: "response",
				id: idRef.current,
				data: {
					cancelled: false,
					items: [],
					usedOnSubmit: Boolean(params.onSubmit)
				}
			})

			setOpen(false)
		},
		[params, selectedItems]
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

	const navigate = useCallback((newPath: string) => {
		setSelectedItems([])
		setPath(newPath)
	}, [])

	const select = useCallback(
		(item: DriveItem) => {
			if (params.multiple) {
				setSelectedItems(prev => {
					if (prev.some(i => i.data.uuid === item.data.uuid)) {
						return prev.filter(i => i.data.uuid !== item.data.uuid)
					} else {
						return [...prev, item]
					}
				})
			} else {
				setSelectedItems(prev => (prev.some(i => i.data.uuid === item.data.uuid) ? [] : [item]))
			}
		},
		[params.multiple]
	)

	useEffect(() => {
		const subscription = events.subscribe("selectDriveItemPrompt", e => {
			if (e.type === "request") {
				idRef.current = e.id

				setParams(e.params ?? {})
				setError(null)
				setLoading(false)
				setPath(e.params?.startPath ?? "/")
				setSelectedItems([])
				setOpen(true)
			}
		})

		return () => {
			subscription.remove()
		}
	}, [])

	return (
		<Block
			shouldBlockFn={() => {
				if (!open) {
					return false
				}

				setPath(prev => (prev === "/" ? prev : pathModule.posix.dirname(prev)))

				return true
			}}
			enableBeforeUnload={false}
		>
			<AlertDialog
				open={open}
				onOpenChange={onOpenChange}
			>
				<AlertDialogContent className="w-[50dvw] max-w-[50dvw]">
					<AlertDialogHeader>
						{params.title && <AlertDialogTitle>{params.title}</AlertDialogTitle>}
						{params.description && <AlertDialogDescription>{params.description}</AlertDialogDescription>}
					</AlertDialogHeader>
					<div className="w-full h-[calc(50dvh)] flex flex-1">
						<Virtuoso
							key={path}
							className="w-full h-full flex flex-1 overflow-x-hidden overflow-y-scroll"
							data={items}
							computeItemKey={(_, item) => item.data.uuid}
							totalCount={items.length}
							defaultItemHeight={36}
							fixedItemHeight={36}
							skipAnimationFrameInResizeObserver={true}
							itemContent={(index, item) => (
								<DriveListItem
									item={item}
									isLast={index === items.length - 1}
									items={items}
									index={index}
									from="select"
									navigate={navigate}
									type="list"
									path={path}
									select={select}
									selected={selectedItems.some(i => i.data.uuid === item.data.uuid)}
								/>
							)}
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					{(params.cancelText || params.confirmText) && (
						<AlertDialogFooter className="flex flex-1 flex-row items-center justify-between">
							<div className="flex flex-row items-center gap-2">Yes</div>
							<div className="flex flex-row items-center gap-2">
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
									>
										{loading ? <LoaderIcon className="animate-spin" /> : params.confirmText}
									</AlertDialogAction>
								)}
							</div>
						</AlertDialogFooter>
					)}
				</AlertDialogContent>
			</AlertDialog>
		</Block>
	)
})

SelectDriveItemPrompt.displayName = "SelectDriveItemPrompt"

export default SelectDriveItemPrompt
