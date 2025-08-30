import { createFileRoute } from "@tanstack/react-router"
import DriveList from "@/components/drive/list"

export const Route = createFileRoute("/drive/$")({
	component: DriveList
})
