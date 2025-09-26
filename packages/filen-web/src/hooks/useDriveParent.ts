import { useLocation } from "@tanstack/react-router"
import { useMemo } from "react"
import pathModule from "path"
import type { DirEnum as FilenSdkRsDirEnum } from "@filen/sdk-rs"
import cacheMap from "@/lib/cacheMap"

export function useDriveParent() {
	const location = useLocation()

	const state = useMemo((): FilenSdkRsDirEnum | null => {
		if (!location.pathname.startsWith("/drive")) {
			return null
		}

		const root = cacheMap.driveRoot ?? null

		if (location.pathname === "/drive") {
			return root
		}

		const parsedPath = pathModule.posix.parse(location.pathname)

		return parsedPath.base.length === 0 || parsedPath.base === "/"
			? root
			: (cacheMap.directoryUuidToDirEnum.get(parsedPath.base) ?? root)
	}, [location.pathname])

	return state
}

export default useDriveParent
