import { createFileRoute } from "@tanstack/react-router"
import Note from "@/components/notes/note"

export const Route = createFileRoute("/notes/$")({
	component: Note
})
