import {
	type File,
	type Dir,
	type DecryptedFileMeta,
	FileMeta_Tags,
	DirMeta_Tags,
	type DecryptedDirMeta,
	type SharedDir,
	type SharedFile,
	DirWithMetaEnum_Tags,
	type ChatParticipant,
	type NoteParticipant,
	type Contact
} from "@filen/sdk-rs"

export function unwrapDirMeta(dir: Dir | SharedDir):
	| {
			meta: DecryptedDirMeta | null
			shared: false
			dir: Dir
			uuid: string | null
			inner: Dir | null
	  }
	| {
			meta: DecryptedDirMeta | null
			shared: true
			dir: SharedDir
			uuid: string | null
			inner: Dir | null
	  } {
	if ("uuid" in dir) {
		switch (dir.meta.tag) {
			case DirMeta_Tags.Decoded: {
				const [decoded] = dir.meta.inner

				return {
					meta: decoded,
					shared: false,
					dir,
					uuid: dir.uuid,
					inner: dir
				}
			}

			default: {
				return {
					meta: null,
					shared: false,
					dir,
					uuid: dir.uuid,
					inner: dir
				}
			}
		}
	}

	switch (dir.dir.tag) {
		case DirWithMetaEnum_Tags.Dir: {
			const [inner] = dir.dir.inner

			switch (inner.meta.tag) {
				case DirMeta_Tags.Decoded: {
					const [decoded] = inner.meta.inner

					return {
						meta: decoded,
						shared: true,
						dir,
						uuid: inner.uuid,
						inner
					}
				}

				default: {
					return {
						meta: null,
						shared: true,
						dir,
						uuid: inner.uuid,
						inner
					}
				}
			}
		}

		default: {
			return {
				meta: null,
				shared: true,
				dir,
				uuid: null,
				inner: null
			}
		}
	}
}

export function unwrapFileMeta(file: File | SharedFile):
	| {
			meta: DecryptedFileMeta | null
			shared: false
			file: File
	  }
	| {
			meta: DecryptedFileMeta | null
			shared: true
			file: SharedFile
	  } {
	if ("uuid" in file) {
		switch (file.meta.tag) {
			case FileMeta_Tags.Decoded: {
				const [decoded] = file.meta.inner

				return {
					meta: decoded,
					shared: false,
					file
				}
			}

			default: {
				return {
					meta: null,
					shared: false,
					file
				}
			}
		}
	}

	switch (file.file.meta.tag) {
		case FileMeta_Tags.Decoded: {
			const [decoded] = file.file.meta.inner

			return {
				meta: decoded,
				shared: true,
				file
			}
		}

		default: {
			return {
				meta: null,
				shared: true,
				file
			}
		}
	}
}

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

export function normalizeFilePathForSdk(filePath: string): string {
	const normalizedPath = filePath.trim().replace(/^file:\/+/, "/")

	return normalizedPath.startsWith("/") ? normalizedPath : "/" + normalizedPath
}

export function normalizeFilePathForExpo(filePath: string): string {
	return `file://${normalizeFilePathForSdk(filePath)}`
}
