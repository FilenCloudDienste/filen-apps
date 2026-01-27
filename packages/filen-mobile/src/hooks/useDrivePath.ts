import { useLocalSearchParams, usePathname } from "expo-router"
import { useMemo } from "@/lib/memo"
import type { Contact } from "@filen/sdk-rs"
import { validate as validateUuid } from "uuid"

export type DrivePath =
	| {
			type: "drive" | "sharedIn" | "recents" | "favorites" | "trash"
			uuid: string | null
	  }
	| {
			type: null
			uuid: null
	  }
	| {
			type: "sharedOut"
			uuid: string
			contact?: Contact
	  }

export default function useDrivePath(): DrivePath {
	const localSearchParams = useLocalSearchParams<{ uuid?: string }>()
	const pathname = usePathname()

	const drivePath = useMemo((): DrivePath => {
		if (pathname.startsWith("/tabs/drive")) {
			if (localSearchParams && localSearchParams.uuid && validateUuid(localSearchParams.uuid)) {
				return {
					type: "drive",
					uuid: localSearchParams.uuid
				}
			}

			return {
				type: "drive",
				uuid: null
			}
		}

		return {
			type: null,
			uuid: null
		}
	}, [localSearchParams, pathname])

	return drivePath
}
