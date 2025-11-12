import { NativeView } from "react-native-boost/runtime"
import { withUniwind } from "uniwind"
import type { ViewProps, View as RNView } from "react-native"
import { memo } from "react"
import { cn } from "@filen/utils"

export const UniwindView = memo(withUniwind(NativeView) as React.FC<ViewProps>)

export const View = memo((props: ViewProps & React.RefAttributes<RNView>) => {
	return (
		<UniwindView
			{...props}
			className={cn("bg-background", props.className)}
		/>
	)
})

View.displayName = "View"

export default View
