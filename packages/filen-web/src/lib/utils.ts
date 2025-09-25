import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { t } from "@/lib/i18n"
import type { DriveItem } from "@/queries/useDriveItems.query"
import pathModule from "path"
import type { ContactTagged } from "@/queries/useContacts.query"
import type { ContactRequestIn, ContactRequestOut, NoteType, NoteParticipant, ChatParticipant } from "@filen/sdk-rs"
import DOMPurify from "dompurify"

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

export function clickDownloadUrl(url: string): void {
	window.open(url, "_blank", "noopener,noreferrer")
}

export type PreviewType = "pdf" | "video" | "audio" | "code" | "text" | "docx" | "image" | "markdown" | "unknown"

export function getPreviewType(fileName: string): PreviewType {
	const parsed = pathModule.posix.parse(fileName.trim().toLowerCase())

	switch (parsed.ext) {
		case ".pdf": {
			return "pdf"
		}

		case ".gif":
		case ".png":
		case ".jpg":
		case ".jpeg":
		case ".webp":
		case ".svg": {
			return "image"
		}

		case ".mov":
		case ".mkv":
		case ".webm":
		case ".mp4": {
			return "video"
		}

		case ".mp3": {
			return "audio"
		}

		case ".js":
		case ".cjs":
		case ".mjs":
		case ".jsx":
		case ".tsx":
		case ".ts":
		case ".cpp":
		case ".c":
		case ".php":
		case ".htm":
		case ".html5":
		case ".html":
		case ".css":
		case ".css3":
		case ".sass":
		case ".xml":
		case ".json":
		case ".sql":
		case ".java":
		case ".kt":
		case ".swift":
		case ".py3":
		case ".py":
		case ".cmake":
		case ".cs":
		case ".dart":
		case ".dockerfile":
		case ".go":
		case ".less":
		case ".yaml":
		case ".vue":
		case ".svelte":
		case ".vbs":
		case ".cobol":
		case ".toml":
		case ".conf":
		case ".sh":
		case ".rs":
		case ".rb":
		case ".ps1":
		case ".bat":
		case ".ps":
		case ".protobuf":
		case ".ahk":
		case ".litcoffee":
		case ".coffee":
		case ".log":
		case ".proto": {
			return "code"
		}

		case ".txt": {
			return "text"
		}

		case ".md": {
			return "markdown"
		}

		case ".docx": {
			return "docx"
		}

		default: {
			return "unknown"
		}
	}
}

export function contactDisplayName(
	contact: ContactTagged | ContactRequestIn | ContactRequestOut | NoteParticipant | ChatParticipant
): string {
	const nickName = contact.nickName?.trim()

	if (nickName && nickName.length > 0) {
		return nickName
	}

	return contact.email.trim()
}

export function sanitizeFileName(filename: string, replacement: string = "_"): string {
	const illegalCharsWindows = /[<>:"/\\|?*]/g
	const illegalCharsUnix = /\//g
	const reservedNamesWindows: Set<string> = new Set([
		"CON",
		"PRN",
		"AUX",
		"NUL",
		"COM1",
		"COM2",
		"COM3",
		"COM4",
		"COM5",
		"COM6",
		"COM7",
		"COM8",
		"COM9",
		"LPT1",
		"LPT2",
		"LPT3",
		"LPT4",
		"LPT5",
		"LPT6",
		"LPT7",
		"LPT8",
		"LPT9"
	])

	let sanitizedFilename = filename.replace(illegalCharsWindows, replacement)

	sanitizedFilename = sanitizedFilename.replace(illegalCharsUnix, replacement)
	sanitizedFilename = sanitizedFilename.replace(/[. ]+$/, "")
	sanitizedFilename = sanitizedFilename.split(" ").join(replacement)

	if (reservedNamesWindows.has(sanitizedFilename.toUpperCase())) {
		sanitizedFilename += replacement
	}

	const maxLength = 255

	if (sanitizedFilename.length > maxLength) {
		sanitizedFilename = sanitizedFilename.substring(0, maxLength)
	}

	if (!sanitizedFilename) {
		return "file"
	}

	return sanitizedFilename
}

export function createNotePreviewFromContentText(type: NoteType, content?: string): string {
	try {
		if (!content || content.length === 0) {
			return ""
		}

		if (type === "rich") {
			if (content.indexOf("<p><br></p>") === -1) {
				return DOMPurify.sanitize(content.split("\n")[0] ?? "").slice(0, 128)
			}

			return DOMPurify.sanitize(content.split("<p><br></p>")[0] ?? "").slice(0, 128)
		}

		if (type === "checklist") {
			const ex = content
				// eslint-disable-next-line quotes
				.split('<ul data-checked="false">')
				.join("")
				// eslint-disable-next-line quotes
				.split('<ul data-checked="true">')
				.join("")
				.split("\n")
				.join("")
				.split("<li>")

			for (const listPoint of ex) {
				const listPointEx = listPoint.split("</li>")

				if (!listPointEx[0]) {
					continue
				}

				if (listPointEx[0].trim().length > 0) {
					return DOMPurify.sanitize(listPointEx[0].trim())
				}
			}

			return ""
		}

		return DOMPurify.sanitize(content.split("\n")[0]!.slice(0, 128))
	} catch {
		return ""
	}
}

export function createExecutableTimeout(callback: () => void, delay?: number) {
	const timeoutId = globalThis.window.setTimeout(callback, delay)

	return {
		id: timeoutId,
		execute: () => {
			globalThis.window.clearTimeout(timeoutId)

			callback()
		},
		cancel: () => globalThis.window.clearTimeout(timeoutId)
	}
}
