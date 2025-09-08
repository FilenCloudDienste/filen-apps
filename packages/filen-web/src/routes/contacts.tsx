import { createFileRoute, Outlet } from "@tanstack/react-router"
import RequireAuthed from "@/components/requireAuthed"

export const Route = createFileRoute("/contacts")({
	component: RouteComponent
})

function RouteComponent() {
	return (
		<RequireAuthed>
			<Outlet />
		</RequireAuthed>
	)
}
