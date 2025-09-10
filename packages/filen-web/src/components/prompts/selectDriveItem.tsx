import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogActionSecondary
} from "@/components/ui/alert-dialog"
import { memo, useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react"
import events from "@/lib/events"
import { LoaderIcon, FolderPlusIcon } from "lucide-react"
import useDriveItemsQuery, { type DriveItem } from "@/queries/useDriveItems.query"
import { orderItemsByType, cn } from "@/lib/utils"
import { Virtuoso } from "react-virtuoso"
import DriveListItem from "../drive/list/item"
import { Block } from "@tanstack/react-router"
import pathModule from "path"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb"
import useElementDimensions from "@/hooks/useElementDimensions"
import { useTranslation } from "react-i18next"
import cacheMap from "@/lib/cacheMap"
import { create } from "zustand"
import { useShallow } from "zustand/shallow"

export type SelectDriveItemPromptTypes = ("file" | "directory")[]

export type SelectDriveItemPromptParams = {
	title?: string
	description?: string
	cancelText?: string
	confirmText?: string
	startPath?: string
	onSubmit?: (items: DriveItem[]) => Promise<void> | void
	multiple?: boolean
	types?: SelectDriveItemPromptTypes
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

export type SelectDriveItemPromptStore = {
	selected: DriveItem[]
	multiple: boolean
	types: SelectDriveItemPromptTypes
	setMultiple: (fn: boolean | ((prev: boolean) => boolean)) => void
	setSelected: (fn: DriveItem[] | ((prev: DriveItem[]) => DriveItem[])) => void
	setTypes: (fn: SelectDriveItemPromptTypes | ((prev: SelectDriveItemPromptTypes) => SelectDriveItemPromptTypes)) => void
}

export const useSelectDriveItemPromptStore = create<SelectDriveItemPromptStore>(set => ({
	selected: [],
	multiple: false,
	types: ["file", "directory"],
	setTypes(fn) {
		set(state => ({
			types: typeof fn === "function" ? fn(state.types) : fn
		}))
	},
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

export const Crumb = memo(
	({
		index,
		component,
		drivePathComponents,
		path,
		setPath,
		disabled
	}: {
		index: number
		component: string
		drivePathComponents: string[]
		path: string
		setPath: React.Dispatch<React.SetStateAction<string>>
		disabled?: boolean
	}) => {
		const { t } = useTranslation()

		const currentParent = useMemo(() => {
			return pathModule.posix.basename(path)
		}, [path])

		const componentName = useMemo(() => {
			if (component === "/") {
				return t("cloudDrive")
			}

			return cacheMap.directoryUUIDToName.get(component) ?? component
		}, [component, t])

		return (
			<Fragment>
				{index > 0 && <BreadcrumbSeparator />}
				<BreadcrumbItem className={cn("shrink-0", disabled && "pointer-events-none opacity-50")}>
					{(component === "/" && drivePathComponents.length === 1) || currentParent === component ? (
						<BreadcrumbPage>{componentName}</BreadcrumbPage>
					) : (
						<BreadcrumbLink
							className="cursor-pointer"
							onClick={() => {
								if (disabled) {
									return
								}

								setPath(pathModule.posix.join("/", ...drivePathComponents.slice(1, index + 1)))
							}}
						>
							{componentName}
						</BreadcrumbLink>
					)}
				</BreadcrumbItem>
			</Fragment>
		)
	}
)

Crumb.displayName = "Crumb"

export const SelectDriveItemPrompt = memo(() => {
	const [open, setOpen] = useState<boolean>(false)
	const idRef = useRef<string>("")
	const [params, setParams] = useState<SelectDriveItemPromptParams>({})
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [path, setPath] = useState<string>("/")
	const [breadcrumbContainerRef, { width: breadcrumbContainerWidth }] = useElementDimensions<HTMLDivElement>()
	const selected = useSelectDriveItemPromptStore(useShallow(state => state.selected))

	const pathComponents = useMemo(() => {
		return ["/", ...path.split("/").filter(Boolean)]
	}, [path])

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

			events.emit("selectDriveItemPrompt", {
				type: "response",
				id: idRef.current,
				data: {
					cancelled: false,
					items: selected,
					usedOnSubmit: Boolean(params.onSubmit)
				}
			})

			setOpen(false)
		},
		[params, selected]
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
		useSelectDriveItemPromptStore.getState().setSelected([])

		setPath(newPath)
	}, [])

	const itemContent = useCallback(
		(index: number, item: DriveItem) => {
			return (
				<DriveListItem
					item={item}
					isLast={index === items.length - 1}
					items={items}
					index={index}
					from="select"
					navigate={navigate}
					type="list"
					path={path}
				/>
			)
		},
		[items, navigate, path]
	)

	const computeItemKey = useCallback((_: number, item: DriveItem) => item.data.uuid, [])

	useEffect(() => {
		const subscription = events.subscribe("selectDriveItemPrompt", e => {
			if (e.type === "request") {
				idRef.current = e.id

				useSelectDriveItemPromptStore.getState().setSelected([])
				useSelectDriveItemPromptStore.getState().setMultiple(e.params?.multiple ?? false)
				useSelectDriveItemPromptStore.getState().setTypes(e.params?.types ?? ["file", "directory"])

				setParams(e.params ?? {})
				setError(null)
				setLoading(false)
				setPath(e.params?.startPath ?? "/")
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
					<AlertDialogHeader className="flex flex-row items-center justify-between gap-8">
						<div className="flex flex-col gap-2">
							{params.title && <AlertDialogTitle>{params.title}</AlertDialogTitle>}
							{params.description && <AlertDialogDescription>{params.description}</AlertDialogDescription>}
						</div>
						<div className="flex flex-row items-center gap-2">
							<AlertDialogActionSecondary
								onClick={e => {
									e.preventDefault()
									e.stopPropagation()

									console.log("create dir")
								}}
							>
								<FolderPlusIcon />
							</AlertDialogActionSecondary>
						</div>
					</AlertDialogHeader>
					<div className="w-full h-[calc(50dvh)] flex flex-1 flex-col overflow-hidden">
						<div
							ref={breadcrumbContainerRef}
							className="flex items-center gap-2 flex-row w-full h-auto overflow-hidden border-b pb-2"
						>
							<Breadcrumb className="overflow-hidden">
								<BreadcrumbList
									className="overflow-hidden flex-nowrap flex flex-row flex-1 h-full"
									style={{
										width: breadcrumbContainerWidth - 32
									}}
								>
									{pathComponents.map((component, index) => (
										<Crumb
											key={index}
											index={index}
											component={component}
											drivePathComponents={pathComponents}
											path={path}
											setPath={setPath}
											disabled={loading}
										/>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						</div>
						<Virtuoso
							key={path}
							className="w-full h-full flex flex-1 overflow-x-hidden overflow-y-scroll"
							data={items}
							computeItemKey={computeItemKey}
							totalCount={items.length}
							defaultItemHeight={36}
							fixedItemHeight={36}
							skipAnimationFrameInResizeObserver={true}
							itemContent={itemContent}
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					{(params.cancelText || params.confirmText) && (
						<AlertDialogFooter className="flex flex-1 flex-row items-center justify-between!">
							{params.types && params.types.includes("directory") && (
								<AlertDialogActionSecondary
									className="self-start"
									onClick={e => {
										e.preventDefault()
										e.stopPropagation()

										console.log("select root directory")
									}}
									disabled={loading || selected.length > 0}
								>
									{loading ? <LoaderIcon className="animate-spin" /> : "Select root directory"}
								</AlertDialogActionSecondary>
							)}
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
