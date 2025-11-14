import { parseNumbersFromString } from "@filen/utils"
import type { DriveItem } from "@/queries/useDriveItems.query"
import type { Note } from "@filen/sdk-rs"

export type SortByType =
	| "nameAsc"
	| "sizeAsc"
	| "mimeAsc"
	| "lastModifiedAsc"
	| "nameDesc"
	| "sizeDesc"
	| "mimeDesc"
	| "lastModifiedDesc"
	| "uploadDateAsc"
	| "uploadDateDesc"
	| "creationAsc"
	| "creationDesc"

export class ItemSorter {
	private uuidCache = new Map<string, number>()
	private lowerCache = new Map<string, string>()
	private numericPartsCache = new Map<string, (string | number)[]>()
	private readonly MAX_CACHE_SIZE = Infinity // Might adjust later if needed

	private getUuidNumber(uuid: string): number {
		let cached = this.uuidCache.get(uuid)

		if (!cached) {
			cached = parseNumbersFromString(uuid)

			this.uuidCache.set(uuid, cached)

			if (this.uuidCache.size > this.MAX_CACHE_SIZE) {
				this.uuidCache.clear()
			}
		}

		return cached
	}

	private getLowerName(name: string): string {
		let cached = this.lowerCache.get(name)

		if (!cached) {
			cached = name.toLowerCase()

			this.lowerCache.set(name, cached)

			if (this.lowerCache.size > this.MAX_CACHE_SIZE) {
				this.lowerCache.clear()
			}
		}

		return cached
	}

	private getNumericParts(str: string): (string | number)[] {
		let cached = this.numericPartsCache.get(str)

		if (!cached) {
			cached = []

			let currentNum = ""
			let currentText = ""

			for (let i = 0; i < str.length; i++) {
				const char = str[i]

				if (!char) {
					continue
				}

				const code = char.charCodeAt(0)

				if (code >= 48 && code <= 57) {
					if (currentText) {
						cached.push(currentText)

						currentText = ""
					}

					currentNum += char
				} else {
					if (currentNum) {
						cached.push(parseInt(currentNum, 10))

						currentNum = ""
					}

					currentText += char
				}
			}

			if (currentNum) {
				cached.push(parseInt(currentNum, 10))
			}

			if (currentText) {
				cached.push(currentText)
			}

			this.numericPartsCache.set(str, cached)

			if (this.numericPartsCache.size > this.MAX_CACHE_SIZE) {
				this.numericPartsCache.clear()
			}
		}

		return cached
	}

	private compareStringsNumeric(a: string, b: string): number {
		const aParts = this.getNumericParts(a)
		const bParts = this.getNumericParts(b)
		const minLen = Math.min(aParts.length, bParts.length)

		for (let i = 0; i < minLen; i++) {
			const aPart = aParts[i]
			const bPart = bParts[i]

			if (typeof aPart === "number" && typeof bPart === "number") {
				if (aPart !== bPart) {
					return aPart - bPart
				}
			} else if (typeof aPart === "string" && typeof bPart === "string") {
				if (aPart !== bPart) {
					return aPart < bPart ? -1 : 1
				}
			} else {
				return typeof aPart === "number" ? -1 : 1
			}
		}

		return aParts.length - bParts.length
	}

	private compareTypes(aType: string, bType: string): number {
		if (aType !== bType) {
			return aType === "directory" || aType === "sharedDirectory" ? -1 : 1
		}

		return 0
	}

	private compareName = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const aLower = this.getLowerName(a.data.decryptedMeta?.name ?? a.data.uuid)
		const bLower = this.getLowerName(b.data.decryptedMeta?.name ?? b.data.uuid)
		const result = this.compareStringsNumeric(aLower, bLower)

		return isAsc ? result : -result
	}

	private compareMime = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const aLower = this.getLowerName(
			a.type === "file"
				? (a.data.decryptedMeta?.mime ?? a.data.decryptedMeta?.name ?? a.data.uuid)
				: a.type === "sharedFile"
					? (a.data.decryptedMeta?.mime ?? a.data.decryptedMeta?.name ?? a.data.uuid)
					: (a.data.decryptedMeta?.name ?? a.data.uuid)
		)

		const bLower = this.getLowerName(
			b.type === "file"
				? (b.data.decryptedMeta?.mime ?? b.data.decryptedMeta?.name ?? b.data.uuid)
				: b.type === "sharedFile"
					? (b.data.decryptedMeta?.mime ?? b.data.decryptedMeta?.name ?? b.data.uuid)
					: (b.data.decryptedMeta?.name ?? b.data.uuid)
		)

		const result = this.compareStringsNumeric(aLower, bLower)

		return isAsc ? result : -result
	}

	private compareSize = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const diff = Number(a.data.size) - Number(b.data.size)

		return isAsc ? diff : -diff
	}

	private compareDate = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const aTimestamp = Number(
			a.type === "file"
				? a.data.timestamp
				: a.type === "directory"
					? a.data.timestamp
					: a.type === "sharedFile"
						? (a.data.decryptedMeta?.created ?? a.data.decryptedMeta?.modified ?? 0)
						: (a.data.decryptedMeta?.created ?? 0)
		)

		const bTimestamp = Number(
			b.type === "file"
				? b.data.timestamp
				: b.type === "directory"
					? b.data.timestamp
					: b.type === "sharedFile"
						? (b.data.decryptedMeta?.created ?? b.data.decryptedMeta?.modified ?? 0)
						: (b.data.decryptedMeta?.created ?? 0)
		)

		if (aTimestamp === bTimestamp) {
			const aUuid = this.getUuidNumber(a.data.uuid)
			const bUuid = this.getUuidNumber(b.data.uuid)
			const diff = aUuid - bUuid

			return isAsc ? diff : -diff
		}

		const diff = aTimestamp - bTimestamp

		return isAsc ? diff : -diff
	}

	private compareLastModified = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const aModified = Number(
			a.type === "file"
				? (a.data.decryptedMeta?.modified ?? a.data.timestamp)
				: a.type === "directory"
					? (a.data.decryptedMeta?.created ?? a.data.timestamp)
					: a.type === "sharedFile"
						? (a.data.decryptedMeta?.modified ?? a.data.decryptedMeta?.created ?? 0)
						: (a.data.decryptedMeta?.created ?? 0)
		)

		const bModified = Number(
			b.type === "file"
				? (b.data.decryptedMeta?.modified ?? b.data.timestamp)
				: b.type === "directory"
					? (b.data.decryptedMeta?.created ?? b.data.timestamp)
					: b.type === "sharedFile"
						? (b.data.decryptedMeta?.modified ?? b.data.decryptedMeta?.created ?? 0)
						: (b.data.decryptedMeta?.created ?? 0)
		)

		if (aModified === bModified) {
			const aUuid = this.getUuidNumber(a.data.uuid)
			const bUuid = this.getUuidNumber(b.data.uuid)
			const diff = aUuid - bUuid

			return isAsc ? diff : -diff
		}

		const diff = aModified - bModified

		return isAsc ? diff : -diff
	}

	private compareCreation = (a: DriveItem, b: DriveItem, isAsc: boolean): number => {
		const typeComp = this.compareTypes(a.type, b.type)

		if (typeComp !== 0) {
			return typeComp
		}

		const aTimestamp = Number(
			a.type === "file"
				? (a.data.decryptedMeta?.created ?? a.data.timestamp)
				: a.type === "directory"
					? (a.data.decryptedMeta?.created ?? a.data.timestamp)
					: a.type === "sharedFile"
						? (a.data.decryptedMeta?.created ?? a.data.decryptedMeta?.modified ?? 0)
						: (a.data.decryptedMeta?.created ?? 0)
		)

		const bTimestamp = Number(
			b.type === "file"
				? (b.data.decryptedMeta?.created ?? b.data.timestamp)
				: b.type === "directory"
					? (b.data.decryptedMeta?.created ?? b.data.timestamp)
					: b.type === "sharedFile"
						? (b.data.decryptedMeta?.created ?? b.data.decryptedMeta?.modified ?? 0)
						: (b.data.decryptedMeta?.created ?? 0)
		)

		if (aTimestamp === bTimestamp) {
			const aUuid = this.getUuidNumber(a.data.uuid)
			const bUuid = this.getUuidNumber(b.data.uuid)
			const diff = aUuid - bUuid

			return isAsc ? diff : -diff
		}

		const diff = aTimestamp - bTimestamp

		return isAsc ? diff : -diff
	}

	private readonly sortMap: Record<string, (a: DriveItem, b: DriveItem) => number> = {
		nameAsc: (a, b) => this.compareName(a, b, true),
		nameDesc: (a, b) => this.compareName(a, b, false),
		sizeAsc: (a, b) => this.compareSize(a, b, true),
		sizeDesc: (a, b) => this.compareSize(a, b, false),
		mimeAsc: (a, b) => this.compareMime(a, b, true),
		mimeDesc: (a, b) => this.compareMime(a, b, false),
		lastModifiedAsc: (a, b) => this.compareLastModified(a, b, true),
		lastModifiedDesc: (a, b) => this.compareLastModified(a, b, false),
		uploadDateAsc: (a, b) => this.compareDate(a, b, true),
		uploadDateDesc: (a, b) => this.compareDate(a, b, false),
		creationAsc: (a, b) => this.compareCreation(a, b, true),
		creationDesc: (a, b) => this.compareCreation(a, b, false)
	}

	public sortItems(items: DriveItem[], type: SortByType): DriveItem[] {
		const compareFunction = this.sortMap[type] ?? this.sortMap["nameAsc"]

		return items.slice().sort(compareFunction)
	}
}

export const itemSorter = new ItemSorter()

export class NotesSorter {
	public sort(notes: Note[]): Note[] {
		return notes.sort((a, b) => {
			if (a.pinned !== b.pinned) {
				return b.pinned ? 1 : -1
			}

			if (a.trash !== b.trash && a.archive === false) {
				return a.trash ? 1 : -1
			}

			if (a.archive !== b.archive) {
				return a.archive ? 1 : -1
			}

			if (a.trash !== b.trash) {
				return a.trash ? 1 : -1
			}

			if (b.editedTimestamp === a.editedTimestamp) {
				return parseNumbersFromString(b.uuid) - parseNumbersFromString(a.uuid)
			}

			return Number(b.editedTimestamp) - Number(a.editedTimestamp)
		})
	}
}

export const notesSorter = new NotesSorter()
