import { memo } from "react"
import { useNetworkInfo } from "@/hooks/useNetworkInfo"

export const RequireInternet = memo(({ children }: { children: React.ReactNode }) => {
	const networkInfo = useNetworkInfo()

	if (!(networkInfo.online && networkInfo.api)) {
		return children // TODO
	}

	return children
})

RequireInternet.displayName = "RequireInternet"

export default RequireInternet
