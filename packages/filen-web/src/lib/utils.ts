import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { t } from "@/lib/i18n"
import { type DriveItem } from "@/queries/useDriveItems.query"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const simpleDateFormatter = new Intl.DateTimeFormat((typeof navigator !== "undefined" && navigator.language) || "de-DE", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit"
})

export function simpleDate(timestamp: number | Date): string {
	const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

	return simpleDateFormatter.format(date)
}

export const simpleDateNoTimeFormatter = new Intl.DateTimeFormat((typeof navigator !== "undefined" && navigator.language) || "de-DE", {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
	hour: undefined,
	minute: undefined,
	second: undefined
})

export function simpleDateNoTime(timestamp: number | Date): string {
	const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

	return simpleDateNoTimeFormatter.format(date)
}

export const simpleDateNoDateFormatter = new Intl.DateTimeFormat((typeof navigator !== "undefined" && navigator.language) || "de-DE", {
	year: undefined,
	month: undefined,
	day: undefined,
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit"
})

export function simpleDateNoDate(timestamp: number | Date): string {
	const date = timestamp instanceof Date ? timestamp : new Date(timestamp)

	return simpleDateNoDateFormatter.format(date)
}

export const formatBytesSizes = [
	t("formatBytes.b"),
	t("formatBytes.kib"),
	t("formatBytes.mib"),
	t("formatBytes.gib"),
	t("formatBytes.tib"),
	t("formatBytes.pib"),
	t("formatBytes.eib"),
	t("formatBytes.zib"),
	t("formatBytes.yib")
]

export function formatBytes(bytes: number, decimals: number = 2): string {
	if (bytes === 0) {
		return "0 Bytes"
	}

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + formatBytesSizes[i]
}

export function parseNumbersFromString(string: string): number {
	if (!string || !/\d/.test(string)) {
		return 0
	}

	if (string.length < 10) {
		return parseInt(string.replace(/\D/g, "")) || 0
	}

	let result = ""
	const maxDigits = 16

	for (let i = 0; i < string.length && result.length < maxDigits; i++) {
		const char = string[i]

		if (char && char >= "0" && char <= "9") {
			result += char
		}
	}

	return parseInt(result) || 0
}

export type OrderByType =
	| "nameAsc"
	| "sizeAsc"
	| "dateAsc"
	| "typeAsc"
	| "lastModifiedAsc"
	| "nameDesc"
	| "sizeDesc"
	| "dateDesc"
	| "typeDesc"
	| "lastModifiedDesc"
	| "uploadDateAsc"
	| "uploadDateDesc"
	| "creationAsc"
	| "creationDesc"

export const orderItemsByTypeCompareItemTypes = (a: DriveItem, b: DriveItem): number => {
	if (a.type !== b.type) {
		return a.type === "directory" ? -1 : 1
	}

	return 0
}

export const orderItemsByTypeCompareFunctions = {
	name: (a: DriveItem, b: DriveItem, isAscending: boolean = true): number => {
		const typeComparison = orderItemsByTypeCompareItemTypes(a, b)

		if (typeComparison !== 0) {
			return typeComparison
		}

		const aName = a.data.meta?.name ?? ""
		const bName = b.data.meta?.name ?? ""

		return isAscending
			? aName.toLowerCase().localeCompare(bName.toLowerCase(), "en", {
					numeric: true
				})
			: bName.toLowerCase().localeCompare(aName.toLowerCase(), "en", {
					numeric: true
				})
	},
	size: (a: DriveItem, b: DriveItem, isAscending: boolean = true): number => {
		const typeComparison = orderItemsByTypeCompareItemTypes(a, b)

		if (typeComparison !== 0) {
			return typeComparison
		}

		const aSize = a.type === "directory" ? 0 : a.data.meta?.size ? Number(a.data.meta.size) : 0
		const bSize = b.type === "directory" ? 0 : b.data.meta?.size ? Number(b.data.meta.size) : 0

		return isAscending ? aSize - bSize : bSize - aSize
	},
	date: (a: DriveItem, b: DriveItem, isAscending: boolean = true): number => {
		const typeComparison = orderItemsByTypeCompareItemTypes(a, b)

		if (typeComparison !== 0) {
			return typeComparison
		}

		const aTimestamp = a.data.meta?.created ? Number(a.data.meta?.created) : 0
		const bTimestamp = b.data.meta?.created ? Number(b.data.meta?.created) : 0

		// TODO: When rust sdk exposes uploaded timestamps
		if (aTimestamp === bTimestamp) {
			const aUuid = parseNumbersFromString(a.data.uuid)
			const bUuid = parseNumbersFromString(b.data.uuid)

			return isAscending ? aUuid - bUuid : bUuid - aUuid
		}

		return isAscending ? aTimestamp - bTimestamp : bTimestamp - aTimestamp
	},
	lastModified: (a: DriveItem, b: DriveItem, isAscending: boolean = true): number => {
		const typeComparison = orderItemsByTypeCompareItemTypes(a, b)

		if (typeComparison !== 0) {
			return typeComparison
		}

		const aModified = a.type === "directory" ? 0 : a.data.meta?.modified ? Number(a.data.meta?.modified) : 0
		const bModified = b.type === "directory" ? 0 : b.data.meta?.modified ? Number(b.data.meta?.modified) : 0

		if (aModified === bModified) {
			const aUuid = parseNumbersFromString(a.data.uuid)
			const bUuid = parseNumbersFromString(b.data.uuid)

			return isAscending ? aUuid - bUuid : bUuid - aUuid
		}

		return isAscending ? aModified - bModified : bModified - aModified
	},
	creation: (a: DriveItem, b: DriveItem, isAscending: boolean = true): number => {
		const typeComparison = orderItemsByTypeCompareItemTypes(a, b)

		if (typeComparison !== 0) {
			return typeComparison
		}

		const aTimestamp = a.data.meta?.created ? Number(a.data.meta?.created) : 0
		const bTimestamp = b.data.meta?.created ? Number(b.data.meta?.created) : 0

		// TODO: When rust sdk exposes uploaded timestamps
		if (aTimestamp === bTimestamp) {
			const aUuid = parseNumbersFromString(a.data.uuid)
			const bUuid = parseNumbersFromString(b.data.uuid)

			return isAscending ? aUuid - bUuid : bUuid - aUuid
		}

		return isAscending ? aTimestamp - bTimestamp : bTimestamp - aTimestamp
	}
}

export const orderItemsByTypeSortMap: Record<string, (a: DriveItem, b: DriveItem) => number> = {
	nameAsc: (a, b) => orderItemsByTypeCompareFunctions.name(a, b, true),
	nameDesc: (a, b) => orderItemsByTypeCompareFunctions.name(a, b, false),
	sizeAsc: (a, b) => orderItemsByTypeCompareFunctions.size(a, b, true),
	sizeDesc: (a, b) => orderItemsByTypeCompareFunctions.size(a, b, false),
	dateAsc: (a, b) => orderItemsByTypeCompareFunctions.date(a, b, true),
	dateDesc: (a, b) => orderItemsByTypeCompareFunctions.date(a, b, false),
	typeAsc: (a, b) => orderItemsByTypeCompareFunctions.name(a, b, true),
	typeDesc: (a, b) => orderItemsByTypeCompareFunctions.name(a, b, false),
	lastModifiedAsc: (a, b) => orderItemsByTypeCompareFunctions.lastModified(a, b, true),
	uploadDateAsc: (a, b) => orderItemsByTypeCompareFunctions.date(a, b, true),
	uploadDateDesc: (a, b) => orderItemsByTypeCompareFunctions.date(a, b, false),
	lastModifiedDesc: (a, b) => orderItemsByTypeCompareFunctions.lastModified(a, b, false),
	creationAsc: (a, b) => orderItemsByTypeCompareFunctions.creation(a, b, true),
	creationDesc: (a, b) => orderItemsByTypeCompareFunctions.creation(a, b, false)
}

export function orderItemsByType({ items, type }: { items: DriveItem[]; type: OrderByType }): DriveItem[] {
	const compareFunction = orderItemsByTypeSortMap[type] ?? orderItemsByTypeSortMap["nameAsc"]

	return [...items].sort(compareFunction)
}

export function normalizeTransferProgress(size: number, bytes: number): number {
	const result = parseInt(((bytes / size) * 100).toFixed(0))

	if (isNaN(result)) {
		return 0
	}

	return result >= 100 ? 100 : result <= 0 ? 0 : result
}

export const bpsToReadableUnits = [
	t("bpsToReadable.kib"),
	t("bpsToReadable.mib"),
	t("bpsToReadable.gib"),
	t("bpsToReadable.tib"),
	t("bpsToReadable.pib"),
	t("bpsToReadable.eib"),
	t("bpsToReadable.zib"),
	t("bpsToReadable.yib")
]

export function bpsToReadable(bps: number): string {
	if (!(bps > 0 && bps < 1024 * 1024 * 1024 * 1024)) {
		bps = 1
	}

	let i = -1

	do {
		bps = bps / 1024
		i++
	} while (bps > 1024)

	return Math.max(bps, 0.1).toFixed(1) + " " + bpsToReadableUnits[i]
}

export function isValidHexColor(value: string, length: number = 6): boolean {
	const hexColorPattern = length >= 6 ? /^#([0-9A-Fa-f]{6})$/ : /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

	return hexColorPattern.test(value)
}
