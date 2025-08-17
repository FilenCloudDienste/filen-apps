import { createFileRoute, useParams } from "@tanstack/react-router"
import { useMemo, memo } from "react"
import { Virtuoso } from "react-virtuoso"
import { EllipsisVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/drive/$")({
	component: RouteComponent
})

export const ListRowLayout = memo(
	({
		name,
		size,
		modified,
		action,
		className
	}: {
		name: React.ReactNode
		size: React.ReactNode
		modified: React.ReactNode
		action: React.ReactNode
		className?: string
	}) => {
		return (
			<div className={cn("flex flex-1 items-center justify-between px-8 border-b flex-row gap-16 py-4", className)}>
				<div className="flex flex-1 items-center shrink-0">{name}</div>
				<div className="flex flex-row gap-16 items-center shrink-0 justify-between">
					<div className="flex flex-row items-center">{size}</div>
					<div className="flex flex-row items-center">{modified}</div>
					<div className="flex flex-row items-center">{action}</div>
				</div>
			</div>
		)
	}
)

ListRowLayout.displayName = "ListRowLayout"

function RouteComponent() {
	const params = useParams({
		from: "/drive/$"
	})

	const users = useMemo(() => {
		return Array.from(
			{
				length: parseInt((params._splat ?? "1").split("/").at(-1) ?? "1")
			},
			(_, index) => ({
				name: `User ${index} ${params._splat}`,
				description: `Description for user ${index} ${params._splat}`
			})
		)
	}, [params._splat])

	return (
		<div className="flex flex-1 w-full h-full flex-col">
			<ListRowLayout
				className="pr-12"
				name="name"
				size="size"
				modified="modified"
				action={<EllipsisVerticalIcon color="transparent" />}
			/>
			<Virtuoso
				key={params._splat}
				style={{
					height: "100%",
					width: "100%"
				}}
				data={users}
				totalCount={users.length}
				computeItemKey={index => index}
				fixedItemHeight={57}
				itemContent={() => (
					<ListRowLayout
						name="name"
						size="size"
						modified="modified"
						action={<EllipsisVerticalIcon />}
					/>
				)}
			/>
		</div>
	)
}
