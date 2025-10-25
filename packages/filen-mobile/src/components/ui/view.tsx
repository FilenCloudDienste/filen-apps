import { NativeView } from "react-native-boost/runtime"
import { withUniwind } from "uniwind"
import type { ViewProps } from "react-native"
import { memo } from "react"
import { cn } from "@/lib/utils"

export const UniwindView = memo(withUniwind(NativeView) as React.FC<ViewProps>)

export const View = memo((props: ViewProps) => {
	return (
		<UniwindView
			{...props}
			className={cn("bg-background", props.className)}
		/>
	)
})

View.displayName = "View"

export default View
