import { useLocation } from "@tanstack/react-router"
import { validate } from "uuid"
import { useMemo } from "react"
import pathModule from "path"

export function useNoteUuidFromPathname() {
	const location = useLocation()

	const noteUuid = useMemo(() => {
		const potentialUuid = pathModule.posix.basename(location.pathname)

		return validate(potentialUuid) ? potentialUuid : null
	}, [location.pathname])

	return noteUuid
}

export default useNoteUuidFromPathname
