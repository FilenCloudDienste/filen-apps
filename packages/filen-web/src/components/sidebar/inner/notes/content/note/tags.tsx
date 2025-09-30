import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import type { Note } from "@filen/sdk-rs"

export const Tag = memo(({ tag }: { tag: Note["tags"][0] }) => {
	return (
		<Badge
			variant="outline"
			className="hover:bg-sidebar-foreground hover:text-white dark:hover:text-black cursor-pointer"
		>
			<p className="text-xs">{tag.name}</p>
		</Badge>
	)
})

Tag.displayName = "Tag"

export const Tags = memo(({ note }: { note: Note }) => {
	return note.tags.length > 0 ? (
		<div className="flex flex-row flex-wrap items-center gap-2">
			{note.tags.map(tag => (
				<Tag
					key={tag.uuid}
					tag={tag}
				/>
			))}
		</div>
	) : null
})

Tags.displayName = "Tags"

export default Tags
