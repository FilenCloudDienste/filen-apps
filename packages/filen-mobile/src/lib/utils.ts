import { ChatParticipant, NoteParticipant, Contact } from "@filen/sdk-rs"

export function contactDisplayName(contact: Contact | NoteParticipant | ChatParticipant): string {
	return contact.nickName && contact.nickName.length > 0 ? contact.nickName : contact.email
}

export function findClosestIndexString(sourceString: string, targetString: string, givenIndex: number): number {
	const extractedSubstring = sourceString.slice(0, givenIndex + 1)
	const lastIndexWithinExtracted = extractedSubstring.lastIndexOf(targetString)

	if (lastIndexWithinExtracted !== -1) {
		return lastIndexWithinExtracted
	}

	for (let offset = 1; offset <= givenIndex; offset++) {
		const substringBefore = sourceString.slice(givenIndex - offset, givenIndex + 1)
		const lastIndexBefore = substringBefore.lastIndexOf(targetString)

		if (lastIndexBefore !== -1) {
			return givenIndex - offset + lastIndexBefore
		}
	}

	return -1
}

export const FORMAT_BYTES_SIZES = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]

export const POWERS_1024 = [1, 1024, 1048576, 1073741824, 1099511627776, 1125899906842624] as const

export function formatBytes(bytes: number, decimals: number = 2): string {
	if (bytes === 0) {
		return "0 B"
	}

	const dm = decimals < 0 ? 0 : decimals
	let i = 0

	if (bytes >= POWERS_1024[5]) {
		i = 5
	} else if (bytes >= POWERS_1024[4]) {
		i = 4
	} else if (bytes >= POWERS_1024[3]) {
		i = 3
	} else if (bytes >= POWERS_1024[2]) {
		i = 2
	} else if (bytes >= POWERS_1024[1]) {
		i = 1
	}

	const value = bytes / POWERS_1024[i]!
	const multiplier = Math.pow(10, dm)
	const rounded = Math.round(value * multiplier) / multiplier

	return rounded + " " + FORMAT_BYTES_SIZES[i]
}
