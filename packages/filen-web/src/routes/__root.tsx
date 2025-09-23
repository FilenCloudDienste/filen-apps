import { Outlet, createRootRoute } from "@tanstack/react-router"
import { ThemeProvider, useTheme } from "@/providers/theme.provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Sidebar from "@/components/sidebar"
import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react"
import DesktopWrapper from "@/components/desktopWrapper"
import { QueryClientProvider } from "@tanstack/react-query"
import queryClient from "@/queries/client"
import setup from "@/lib/setup"
import { Toaster } from "@/components/ui/sonner"
import DragSelect from "@/components/dragSelect"
import DriveInfo from "@/components/drive/info"
import Preview from "@/components/preview"
import { cn } from "@/lib/utils"
import { IS_DESKTOP } from "@/constants"
import InputPrompt from "@/components/prompts/input"
import SelectDriveItemPrompt from "@/components/prompts/selectDriveItem"
import ConfirmPrompt from "@/components/prompts/confirm"
import SelectContactPrompt from "@/components/prompts/selectContact"
import { useAuth } from "@/hooks/useAuth"

export const Root = memo(() => {
	const settingUpRef = useRef<boolean>(false)
	const [setupDone, setSetupDone] = useState<boolean>(false)
	const { theme } = useTheme()
	const { authed } = useAuth()

	const withSidebar = useMemo(() => {
		return authed
	}, [authed])

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
			key={theme}
		>
			<DesktopWrapper>
				{setupDone ? (
					<QueryClientProvider client={queryClient}>
						{withSidebar ? (
							<SidebarProvider className="flex flex-1 h-full w-full">
								<Sidebar />
								<div
									className={cn(
										"flex flex-col flex-1 w-full h-full gap-4 pl-0!",
										IS_DESKTOP ? "p-0 md:p-4 md:pt-6" : "p-0 md:p-4"
									)}
								>
									<div className="flex flex-row w-full h-full gap-4">
										<SidebarInset className="z-50 rounded-xl shadow-sm dark:border dark:border-border">
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
						<SelectContactPrompt />
						<ConfirmPrompt />
						<SelectDriveItemPrompt />
						<InputPrompt />
						<Preview />
						<DragSelect />
						<Toaster
							position="top-center"
							richColors={true}
							theme={theme}
						/>
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
