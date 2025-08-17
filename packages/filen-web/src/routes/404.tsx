import { createFileRoute, Link, Navigate } from "@tanstack/react-router"
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IS_DESKTOP } from "@/constants"

export const NotFound = memo(() => {
	if (IS_DESKTOP) {
		return <Navigate to="/" />
	}

	return (
		<div className="flex flex-1 bg-background items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardContent className="pt-6">
					<div className="space-y-6">
						<div className="text-8xl font-bold text-muted-foreground">404</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold text-foreground">Page Not Found</h1>
							<p className="text-muted-foreground">
								Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or you
								entered the wrong URL.
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<Button
								asChild={true}
								variant="outline"
							>
								<Link to="/">Go Home</Link>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
})

NotFound.displayName = "NotFound"

export const Route = createFileRoute("/404")({
	component: NotFound
})
