import type { Note as TNote } from "@filen/sdk-rs"
import { Menu } from "@/components/ui/menu"
import { memo, useMemo } from "@/lib/memo"
import { cn } from "@filen/utils"

export const Note = memo(
	({
		children,
		type,
		className
	}: {
		children: React.ReactNode
		type: React.ComponentPropsWithoutRef<typeof Menu>["type"]
		className?: string
		note: TNote
	}) => {
		const buttons = useMemo(() => {
			return [
				{
					title: "Title 1"
				},
				{
					title: "Title 2"
				}
			]
		}, [])

		return (
			<Menu
				className={cn("flex-row w-full h-full", className)}
				type={type}
				buttons={buttons}
			>
				{children}
			</Menu>
		)
	}
)

export default Note
