import { createFileRoute } from "@tanstack/react-router"
import NotesIndex from "@/components/notes"

export const Route = createFileRoute("/notes/")({
	component: NotesIndex
})
