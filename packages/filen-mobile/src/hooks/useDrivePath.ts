import { usePathname } from "expo-router"
import { useMemo } from "react"
import type { Contact } from "@filen/sdk-rs"

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
	const pathname = usePathname()

	return useMemo(() => {
		if (pathname.startsWith("/tabs/drive")) {
			return {
				type: "drive",
				pathname: `/${pathname.replace("/tabs/drive", "")}`
			}
		}

		return {
			type: null,
			pathname: null
		}
	}, [pathname])
}
