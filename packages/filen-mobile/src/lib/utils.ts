import { ChatParticipant, NoteParticipant, Contact } from "@filen/sdk-rs"

export function contactDisplayName(contact: Contact | NoteParticipant | ChatParticipant): string {
	return contact.nickName && contact.nickName.length > 0 ? contact.nickName : contact.email
}
