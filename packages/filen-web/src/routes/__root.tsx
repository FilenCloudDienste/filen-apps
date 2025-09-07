import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router"
import { ThemeProvider } from "@/providers/theme.provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import DriveHeader from "@/components/drive/header"
import { memo, useMemo, useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import DesktopWrapper from "@/components/desktopWrapper"
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "@/queries/client"
import setup from "@/lib/setup"
import { Toaster } from "@/components/ui/sonner"
import DragSelect from "@/components/dragSelect"
import DriveInfo from "@/components/drive/info"
import Preview from "@/components/preview"
import RequireInternet from "@/components/requireInternet"
import { cn } from "@/lib/utils"
import { IS_DESKTOP } from "@/constants"
import InputPrompt from "@/components/prompts/input"
import SelectDriveItemPrompt from "@/components/prompts/selectDriveItem"

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
				console.error(setupResult.errorType)

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
				<RequireInternet>
					{setupDone ? (
						<QueryClientProvider client={queryClient}>
							{withSidebar ? (
								<SidebarProvider className="flex flex-1 h-full w-full">
									<AppSidebar />
									<div
										className={cn(
											"flex flex-col flex-1 w-full h-full gap-4",
											IS_DESKTOP ? "p-0 md:p-4 md:pt-6" : "p-0 md:p-4"
										)}
									>
										<div className="flex flex-row w-full h-full gap-4">
											<SidebarInset className="z-50 rounded-xl shadow-sm">
												{pathname.startsWith("/drive") && <DriveHeader />}
												<Outlet />
											</SidebarInset>
											<DriveInfo />
										</div>
										{/*<div className="flex flex-row rounded-lg bg-background w-full h-auto shadow-sm">player</div>*/}
									</div>
								</SidebarProvider>
							) : (
								<Outlet />
							)}
							<SelectDriveItemPrompt />
							<InputPrompt />
							<Preview />
							<DragSelect />
							<Toaster />
						</QueryClientProvider>
					) : (
						<div className="flex flex-1 absolute w-full h-full z-[9999] top-0 left-0 right-0 bottom-0 bg-background items-center justify-center">
							Setting up...
						</div>
					)}
				</RequireInternet>
			</DesktopWrapper>
		</ThemeProvider>
	)
})

Root.displayName = "Root"

export const Route = createRootRoute({
	component: Root
})
