import { memo } from "react"
import Header from "./header"
import type { Note } from "@filen/sdk-rs"

export const Container = memo(({ note, children }: { note: Note; children: React.ReactNode }) => {
	return (
		<div className="flex flex-1 w-full h-full flex-col overflow-hidden">
			<Header note={note} />
			<div className="flex flex-1 flex-row overflow-x-hidden overflow-y-auto h-full w-full rounded-b-lg">{children}</div>
		</div>
	)
})

Container.displayName = "Container"

export default Container
