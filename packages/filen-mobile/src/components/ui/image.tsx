import { Image as ExpoImage } from "expo-image"
import { withUniwind } from "uniwind"
import { memo } from "@/lib/memo"
import { cn } from "@filen/utils"

export const UniwindImage = memo(withUniwind(ExpoImage) as React.FC<React.ComponentProps<typeof ExpoImage>>)

export const Image = memo((props: React.ComponentProps<typeof ExpoImage> & React.RefAttributes<ExpoImage>) => {
	return (
		<UniwindImage
			{...props}
			className={cn("bg-background", props.className)}
		/>
	)
})
