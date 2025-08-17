import { createFileRoute, Link } from "@tanstack/react-router"
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export const Error = memo(() => {
	return (
		<div className="flex flex-1 bg-background items-center justify-center p-4">
			<Card className="w-full max-w-md text-center">
				<CardContent className="pt-6">
					<div className="space-y-6">
						<div className="flex justify-center">
							<AlertTriangle className="h-16 w-16 text-destructive" />
						</div>
						<div className="space-y-2">
							<h1 className="text-2xl font-semibold text-foreground">Something went wrong!</h1>
							<p className="text-muted-foreground">
								An unexpected error occurred. Don&apos;t worry, our team has been notified and we&apos;re working to fix it.
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

Error.displayName = "Error"

export const Route = createFileRoute("/error")({
	component: Error
})
