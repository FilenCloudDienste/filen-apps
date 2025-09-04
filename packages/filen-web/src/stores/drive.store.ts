import { create } from "zustand"
import type { DriveItem } from "@/queries/useDriveItems.query"

export type DriveStore = {
	selectedItems: DriveItem[]
	visibleItemUuids: string[]
	draggingItems: DriveItem[]
	setDraggingItems: (fn: DriveItem[] | ((prev: DriveItem[]) => DriveItem[])) => void
	setVisibleItemUuids: (fn: string[] | ((prev: string[]) => string[])) => void
	setSelectedItems: (fn: DriveItem[] | ((prev: DriveItem[]) => DriveItem[])) => void
}

export const useDriveStore = create<DriveStore>(set => ({
	selectedItems: [],
	visibleItemUuids: [],
	draggingItems: [],
	setDraggingItems(fn) {
		set(state => ({
			draggingItems: typeof fn === "function" ? fn(state.draggingItems) : fn
		}))
	},
	setVisibleItemUuids(fn) {
		set(state => ({
			visibleItemUuids: typeof fn === "function" ? fn(state.visibleItemUuids) : fn
		}))
	},
	setSelectedItems(fn) {
		set(state => ({
			selectedItems: typeof fn === "function" ? fn(state.selectedItems) : fn
		}))
	}
}))

export default useDriveStore
