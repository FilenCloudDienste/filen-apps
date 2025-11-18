import {
	type File,
	type Dir,
	type DecryptedFileMeta,
	FileMeta_Tags,
	DirMeta_Tags,
	type DecryptedDirMeta,
	type SharedDir,
	type SharedFile,
	DirWithMetaEnum_Tags
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
