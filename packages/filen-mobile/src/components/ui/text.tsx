import { NativeText } from "react-native-boost/runtime"
import { withUniwind } from "uniwind"
import type { TextProps } from "react-native"
import { memo } from "react"
import { cn } from "@/lib/utils"

export const UniwindText = memo(withUniwind(NativeText) as React.FC<TextProps>)

export const Text = memo((props: TextProps) => {
	return (
		<UniwindText
			{...props}
			className={cn("text-foreground", props.className)}
		/>
	)
})

Text.displayName = "Text"

export default Text
