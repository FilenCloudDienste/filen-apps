import * as React from "react"
import { Folder, ChevronRight, NotebookIcon, Contact2Icon, MessageCircleIcon } from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarGroupLabel,
	useSidebar
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "@tanstack/react-router"

// This is sample data
const data = {
	user: {
		name: "shadcn",
		email: "m@example.com",
		avatar: "/avatars/shadcn.jpg"
	},
	navMain: [
		{
			title: "Notes",
			url: "/notes",
			icon: NotebookIcon,
			isActive: false
		},
		{
			title: "Chats",
			url: "/chats",
			icon: MessageCircleIcon,
			isActive: false
		},
		{
			title: "Contacts",
			url: "/contacts",
			icon: Contact2Icon,
			isActive: false
		}
	],
	tree: [
		["app", ["api", ["hello", ["route.ts"]], "page.tsx", "layout.tsx", ["blog", ["page.tsx"]]]],
		[
			"components",
			[
				"ui",
				"button.tsx",
				"card.tsx",
				[
					"foo",
					"bar",
					["foo", "bar", ["foo", "bar", ["foo", "bar", ["foo", "bar", ["foo", "bar", ["foo", "bar", ["foo", "bar"]]]]]]]
				]
			],
			"header.tsx",
			"footer.tsx"
		],
		["lib", ["util.ts"]],
		["public", "favicon.ico", "vercel.svg"],
		".eslintrc.json",
		".gitignore",
		"next.config.js",
		"tailwind.config.js",
		"package.json",
		"README.md"
	]
}

type FileTreeNode = string | FileTreeNode[]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { setOpen } = useSidebar()
	const { t } = useTranslation()
	const location = useLocation()

	return (
		<Sidebar
			collapsible="offcanvas"
			className="overflow-x-hidden *:data-[sidebar=sidebar]:flex-row p-0"
			variant="inset"
			{...props}
		>
			<Sidebar
				collapsible="none"
				className="w-[calc(var(--sidebar-width-icon)+1px)]! overflow-x-hidden p-2 border-r"
			>
				<SidebarHeader>
					<SidebarMenu>
						<SidebarMenuItem className="z-[10000]">
							<SidebarMenuButton
								size="lg"
								asChild={true}
								className="md:h-8 md:p-0"
							>
								<Link to="/drive">
									<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg p-[6px]">
										<img src="/img/light_logo.svg" />
									</div>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent className="px-1.5 md:px-0">
							<SidebarMenu>
								{data.navMain.map(item => (
									<SidebarMenuItem key={item.title}>
										<Link
											to={item.url}
											onClick={() => {
												setOpen(true)
											}}
										>
											<SidebarMenuButton
												tooltip={{
													children: item.title,
													hidden: false
												}}
												isActive={location.pathname === item.url}
												className="px-2.5 md:px-2"
											>
												<item.icon />
												<span>{item.title}</span>
											</SidebarMenuButton>
										</Link>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					<NavUser user={data.user} />
				</SidebarFooter>
			</Sidebar>
			<Sidebar
				collapsible="none"
				className="hidden flex-1 md:flex overflow-x-hidden"
			>
				<SidebarHeader className="gap-3.5 p-4">
					<div className="flex w-full items-center justify-between">
						<div className="text-foreground text-base font-medium">{location.pathname}</div>
						<Label className="flex items-center gap-2 text-sm">
							<span>Unreads</span>
							<Switch className="shadow-none" />
						</Label>
					</div>
					<SidebarInput placeholder="Search..." />
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup className="overflow-x-hidden">
						<SidebarGroupLabel>{t("cloudDrive")}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{data.tree.map((node, index) => (
									<Tree
										key={index}
										node={node}
										level={0}
									/>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
			</Sidebar>
		</Sidebar>
	)
}

function Tree({ node, level }: { node: FileTreeNode; level: number }) {
	const [name, ...nodes] = Array.isArray(node) ? node : [node]

	if (!nodes.length) {
		return (
			<Link
				to="/drive/$"
				params={{
					_splat: `/${Math.random().toString().substring(2, 5)}/${Math.random().toString().substring(2, 5)}`
				}}
			>
				<SidebarMenuButton
					style={{
						width: `calc(var(--sidebar-width) - var(--sidebar-width-icon) - ${level * 26 + 16}px)`
					}}
				>
					<Folder />
					{name}
				</SidebarMenuButton>
			</Link>
		)
	}

	return (
		<SidebarMenuItem>
			<Collapsible
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
				style={{
					width: `calc(var(--sidebar-width) - var(--sidebar-width-icon) - ${level * 26 + 16}px)`
				}}
			>
				<CollapsibleTrigger asChild={true}>
					<SidebarMenuButton>
						<ChevronRight className="transition-transform" />
						<Folder />
						{name}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{nodes.map((subNode, index) => (
							<Tree
								key={index}
								node={subNode}
								level={level + 1}
							/>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	)
}
