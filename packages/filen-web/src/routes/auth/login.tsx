import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import authService from "@/services/auth.service"
import { memo, useState, useCallback } from "react"
import { LoaderCircleIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { arktypeResolver } from "@hookform/resolvers/arktype"
import { type } from "arktype"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

export const formSchema = type({
	email: type("string.email").describe("tba").configure({
		message: "tba"
	}),
	password: type("string").atLeastLength(1).atMostLength(65536).describe("tba").configure({
		message: "tba"
	})
})

export const Login = memo(() => {
	const navigate = useNavigate()
	const [loggingIn, setLoggingIn] = useState<boolean>(false)

	const form = useForm<typeof formSchema.infer>({
		resolver: arktypeResolver(formSchema),
		defaultValues: {
			email: "",
			password: ""
		}
	})

	const onSubmit = useCallback(
		async (values: typeof formSchema.infer) => {
			setLoggingIn(true)

			try {
				await authService.login(values.email, values.password)

				navigate({
					to: "/drive/$"
				})
			} catch (e) {
				console.error(e)

				if (typeof e === "string") {
					if (e.includes("email_or_password_wrong")) {
						form.reset()

						toast.error("tba")
					}
				}
			} finally {
				setLoggingIn(false)
			}
		},
		[navigate, form]
	)

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
							<CardTitle className="text-xl">tba</CardTitle>
							<CardDescription>tba</CardDescription>
						</CardHeader>
						<CardContent>
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="space-y-4"
								>
									<FormField
										control={form.control}
										name="email"
										disabled={loggingIn}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Email</FormLabel>
												<FormControl>
													<Input
														placeholder="tba"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="password"
										disabled={loggingIn}
										render={({ field }) => (
											<FormItem>
												<FormLabel>Password</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="••••••••••••••••"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full mt-2"
										disabled={loggingIn}
									>
										{loggingIn ? <LoaderCircleIcon className="animate-spin" /> : "Login"}
									</Button>
								</form>
							</Form>
						</CardContent>
					</Card>
					<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
						tba <a href="#">tba</a> tba <a href="#">tba</a>.
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
