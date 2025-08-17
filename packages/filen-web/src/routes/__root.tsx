import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { ThemeProvider } from "@/providers/theme.provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { memo, useMemo } from "react"
import useConfig from "@/hooks/useConfig"
import DesktopWrapper from "@/components/desktopWrapper"

export const Root = memo(() => {
	const { pathname } = useLocation()
	const {
		config: { authed }
	} = useConfig()

	const withSidebar = useMemo(() => {
		return authed && !(pathname.startsWith("/404") || pathname.startsWith("/error"))
	}, [authed, pathname])

	return (
		<ThemeProvider
			defaultTheme="system"
			storageKey="filen-ui-theme"
		>
			<DesktopWrapper>
				{withSidebar ? (
					<SidebarProvider className="flex h-full">
						<AppSidebar />
						<SidebarInset
							className="z-50"
							sidebarRight={<div>hello world</div>}
						>
							{pathname.startsWith("/drive") && (
								<header className="flex h-16 shrink-0 items-center gap-2">
									<div className="flex items-center gap-2 px-4">
										{/*<SidebarTrigger className="-ml-1" />
										<Separator
											orientation="vertical"
											className="mr-2 data-[orientation=vertical]:h-4"
										/>*/}
										<Breadcrumb>
											<BreadcrumbList>
												<BreadcrumbItem className="hidden md:block">
													<BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
												</BreadcrumbItem>
												<BreadcrumbSeparator className="hidden md:block" />
												<BreadcrumbItem>
													<BreadcrumbPage>Data Fetching</BreadcrumbPage>
												</BreadcrumbItem>
											</BreadcrumbList>
										</Breadcrumb>
									</div>
								</header>
							)}
							<Outlet />
						</SidebarInset>
					</SidebarProvider>
				) : (
					<Outlet />
				)}
				<TanStackRouterDevtools
					position="bottom-right"
					initialIsOpen={false}
				/>
			</DesktopWrapper>
		</ThemeProvider>
	)
})

Root.displayName = "Root"

export const Route = createRootRoute({
	component: Root
})
