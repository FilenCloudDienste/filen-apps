import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router"
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { ThemeProvider } from "@/providers/theme.provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import DriveHeader from "@/components/drive/list/header"
import { memo, useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import DesktopWrapper from "@/components/desktopWrapper"
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "@/queries/client"
import setup from "@/lib/setup"
import { Toaster } from "@/components/ui/sonner"
import DragSelect from "@/components/dragSelect"

export const Root = memo(() => {
	const { pathname } = useLocation()
	const { authed } = useAuth()
	const settingUpRef = useRef<boolean>(false)
	const [setupDone, setSetupDone] = useState<boolean>(false)

	const withSidebar = useMemo(() => {
		return authed && !(pathname.startsWith("/404") || pathname.startsWith("/error"))
	}, [authed, pathname])

	const doSetup = useCallback(async () => {
		if (setupDone || settingUpRef.current) {
			return
		}

		settingUpRef.current = true

		try {
			const setupResult = await setup()

			if (!setupResult.success) {
				console.error(setupResult.errorMessage)

				return
			}

			setSetupDone(true)
		} catch (e) {
			console.error(e)
		} finally {
			settingUpRef.current = false
		}
	}, [setupDone])

	useEffect(() => {
		doSetup()
	}, [doSetup])

	return (
		<ThemeProvider
			defaultTheme="system"
			storageKey="filen-ui-theme"
		>
			<DesktopWrapper>
				{setupDone ? (
					<QueryClientProvider client={queryClient}>
						{withSidebar ? (
							<SidebarProvider className="flex h-full">
								<AppSidebar />
								<SidebarInset className="z-50">
									{pathname.startsWith("/drive") && <DriveHeader />}
									<Outlet />
								</SidebarInset>
							</SidebarProvider>
						) : (
							<Outlet />
						)}
						{/*<TanStackRouterDevtools
							position="bottom-right"
							initialIsOpen={false}
						/>*/}
						<DragSelect />
						<Toaster />
					</QueryClientProvider>
				) : (
					<div className="flex flex-1 absolute w-full h-full z-[9999] top-0 left-0 right-0 bottom-0 bg-background items-center justify-center">
						Setting up...
					</div>
				)}
			</DesktopWrapper>
		</ThemeProvider>
	)
})

Root.displayName = "Root"

export const Route = createRootRoute({
	component: Root
})
