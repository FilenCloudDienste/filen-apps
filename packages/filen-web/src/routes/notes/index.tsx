import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/notes/")({
	component: RouteComponent
})

function RouteComponent() {
	return <div>Hello notes!</div>
}
