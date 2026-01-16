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
