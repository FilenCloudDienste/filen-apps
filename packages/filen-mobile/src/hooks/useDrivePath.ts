import { useLocalSearchParams, usePathname } from "expo-router"
import { useMemo } from "react"
import type { Contact } from "@filen/sdk-rs"
import { Paths } from "expo-file-system"

export type DrivePath =
	| {
			type: "drive" | "sharedIn" | "recents" | "favorites" | "trash"
			pathname: string
	  }
	| {
			type: null
			pathname: null
	  }
	| {
			type: "sharedOut"
			pathname: string
			contact?: Contact
	  }

export default function useDrivePath(): DrivePath {
	const localSearchParams = useLocalSearchParams<{ path?: string[] }>()
	const pathname = usePathname()

	return useMemo(() => {
		if (pathname.startsWith("/tabs/drive")) {
			if (localSearchParams && localSearchParams.path && Array.isArray(localSearchParams.path) && localSearchParams.path.length > 0) {
				return {
					type: "drive",
					pathname: Paths.join("/", ...localSearchParams.path)
				}
			}

			return {
				type: "drive",
				pathname: "/"
			}
		}

		return {
			type: null,
			pathname: null
		}
	}, [localSearchParams, pathname])
}
