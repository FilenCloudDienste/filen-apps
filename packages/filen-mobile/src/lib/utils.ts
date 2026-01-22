import { ChatParticipant, NoteParticipant, Contact } from "@filen/sdk-rs"

export function contactDisplayName(contact: Contact | NoteParticipant | ChatParticipant): string {
	return contact.nickName && contact.nickName.length > 0 ? contact.nickName : contact.email
}

export function sanitizeFileName(filename: string, replacement: string = "_"): string {
	// Normalize to UTF-8 NFC form (canonical decomposition followed by canonical composition)
	let sanitizedFilename = filename.normalize("NFC")

	// Remove or replace problematic Unicode characters
	// Remove zero-width characters and other invisible/control characters
	// eslint-disable-next-line no-control-regex
	sanitizedFilename = sanitizedFilename.replace(/[\u200B-\u200D\uFEFF\u00AD\u0000-\u001F\u007F-\u009F]/g, "")

	// iOS specific: Replace characters that cause issues in APFS
	// APFS doesn't allow: / (directory separator) and : (legacy HFS+ path separator)
	// Also problematic: null bytes
	sanitizedFilename = sanitizedFilename.replace(/[/:]/g, replacement)

	// Android specific: Replace characters illegal in FAT32, exFAT, and ext4
	// FAT32/exFAT don't allow: < > : " / \ | ? *
	// Note: Android 12+ uses F2FS/ext4 for internal storage but may use FAT32/exFAT for external
	sanitizedFilename = sanitizedFilename.replace(/[<>:"\\|?*]/g, replacement)

	// Remove leading/trailing dots and spaces (problematic on both platforms)
	// iOS: Leading dots create hidden files
	// Android: Trailing dots/spaces can cause issues
	sanitizedFilename = sanitizedFilename.replace(/^[. ]+|[. ]+$/g, "")

	// Optionally normalize whitespace (you may want to keep this configurable)
	sanitizedFilename = sanitizedFilename.replace(/\s+/g, replacement)

	// iOS: APFS supports up to 255 UTF-8 bytes per filename component
	// Android: ext4 supports 255 bytes, F2FS supports 255 bytes
	// Both measure in bytes, not characters
	const maxByteLength = 255
	const byteLength = new TextEncoder().encode(sanitizedFilename).length

	// Trim filename preserving extension if possible
	if (byteLength > maxByteLength) {
		const extensionMatch = sanitizedFilename.match(/(\.[^.]{1,10})$/)
		const extension = extensionMatch ? extensionMatch[1] : ""
		const extensionBytes = new TextEncoder().encode(extension).length
		const maxNameBytes = maxByteLength - extensionBytes

		let baseName = extension ? sanitizedFilename.slice(0, -extension.length) : sanitizedFilename
		let baseBytes = new TextEncoder().encode(baseName).length

		while (baseBytes > maxNameBytes && baseName.length > 0) {
			baseName = baseName.slice(0, -1)
			baseBytes = new TextEncoder().encode(baseName).length
		}

		sanitizedFilename = baseName + extension
	}

	// Final validation
	if (!sanitizedFilename || sanitizedFilename === "." || sanitizedFilename === "..") {
		return "file"
	}

	return sanitizedFilename
}
