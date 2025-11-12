import { memo } from "react"
import "@/global.css"

export const StyleProvider = memo(({ children }: { children: React.ReactNode }) => {
	return children
})

StyleProvider.displayName = "StyleProvider"

export default StyleProvider
