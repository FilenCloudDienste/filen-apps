import { createFileRoute } from "@tanstack/react-router"
import { memo } from "react"

export const Drive = memo(() => {
	return (
		<div>
			<h1>Hello Drive</h1>
		</div>
	)
})

Drive.displayName = "Drive"

export const Route = createFileRoute("/drive/")({
	component: Drive
})
