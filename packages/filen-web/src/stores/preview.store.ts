import { create } from "zustand"
import type { DriveItemFile } from "@/queries/useDriveItems.query"
import { type PreviewType, getPreviewType } from "@/lib/utils"

export type DriveItemFileWithPreviewType = DriveItemFile & {
	previewType: PreviewType
}

export type PreviewStore = {
	items: DriveItemFileWithPreviewType[]
	open: boolean
	initialIndex: number
	currentIndex: number
	setOpen: (fn: boolean | ((prev: boolean) => boolean)) => void
	setItems: (fn: DriveItemFileWithPreviewType[] | ((prev: DriveItemFileWithPreviewType[]) => DriveItemFileWithPreviewType[])) => void
	setInitialIndex: (fn: number | ((prev: number) => number)) => void
	setCurrentIndex: (fn: number | ((prev: number) => number)) => void
	show: ({ items, initialIndex }: { items: DriveItemFile[]; initialIndex: number }) => void
	hide: () => void
}

export const usePreviewStore = create<PreviewStore>(set => ({
	items: [],
	open: false,
	currentIndex: 0,
	initialIndex: 0,
	setInitialIndex(fn) {
		set(state => ({
			initialIndex: typeof fn === "function" ? fn(state.initialIndex) : fn
		}))
	},
	setCurrentIndex(fn) {
		set(state => ({
			currentIndex: typeof fn === "function" ? fn(state.currentIndex) : fn
		}))
	},
	setOpen(fn) {
		set(state => ({
			open: typeof fn === "function" ? fn(state.open) : fn
		}))
	},
	setItems(fn) {
		set(state => ({
			items: typeof fn === "function" ? fn(state.items) : fn
		}))
	},
	show: ({ items, initialIndex }) => {
		set({
			items: items
				.filter(i => Boolean(i.meta?.name))
				.map(i => ({
					...i,
					previewType: getPreviewType(i.meta?.name ?? "")
				})),
			open: true,
			initialIndex,
			currentIndex: initialIndex
		})
	},
	hide: () => {
		set({
			items: [],
			open: false,
			initialIndex: 0,
			currentIndex: 0
		})
	}
}))

export default usePreviewStore
