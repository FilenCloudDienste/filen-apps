import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useConfig from "@/hooks/useConfig"
import { memo, useState } from "react"
import { LoaderCircleIcon } from "lucide-react"

export const Login = memo(() => {
	const { setConfig } = useConfig()
	const navigate = useNavigate()
	const [loggingIn, setLoggingIn] = useState<boolean>(false)

	return (
		<div className="bg-background flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<Link
					to="/"
					className="flex items-center gap-2 self-center font-medium"
				>
					<div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md p-[3px]">
						<img src="/img/dark_logo.svg" />
					</div>
					<p>Filen</p>
				</Link>
				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader className="text-center">
							<CardTitle className="text-xl">Welcome back</CardTitle>
							<CardDescription>Login to your Filen account</CardDescription>
						</CardHeader>
						<CardContent>
							<form>
								<div className="grid gap-6">
									<div className="grid gap-6">
										<div className="grid gap-3">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												placeholder="m@example.com"
												required={true}
												disabled={loggingIn}
											/>
										</div>
										<div className="grid gap-3">
											<div className="flex items-center">
												<Label htmlFor="password">Password</Label>
												<a
													href="#"
													className="ml-auto text-sm underline-offset-4 hover:underline"
												>
													Forgot your password?
												</a>
											</div>
											<Input
												id="password"
												type="password"
												required={true}
												disabled={loggingIn}
											/>
										</div>
										<Button
											type="submit"
											className="w-full"
											disabled={loggingIn}
											onClick={async () => {
												setLoggingIn(true)

												try {
													await new Promise<void>(resolve => setTimeout(resolve, 3000)) // Simulate login delay

													setConfig(prev => ({
														...prev,
														authed: true
													}))

													navigate({
														to: "/drive/$"
													})
												} finally {
													setLoggingIn(false)
												}
											}}
										>
											{loggingIn ? <LoaderCircleIcon className="animate-spin" /> : "Login"}
										</Button>
									</div>
									<div className="text-center text-sm">
										Don&apos;t have an account?{" "}
										<a
											href="#"
											className="underline underline-offset-4"
										>
											Sign up
										</a>
									</div>
								</div>
							</form>
						</CardContent>
					</Card>
					<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
						By logging in you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
					</div>
				</div>
			</div>
		</div>
	)
})

Login.displayName = "Login"

export const Route = createFileRoute("/auth/login")({
	component: Login
})
