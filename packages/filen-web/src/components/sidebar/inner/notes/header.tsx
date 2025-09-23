import { memo, useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { SidebarHeader, SidebarInput } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import contactsService from "@/services/contacts.service"
import { useTranslation } from "react-i18next"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

export const InnerSidebarNotesHeader = memo(() => {
	const { t } = useTranslation()

	const add = useCallback(() => {
		contactsService.sendContactRequest().catch(console.error)
	}, [])

	return (
		<SidebarHeader className="gap-3.5 p-4 pb-0">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="text-foreground text-base font-medium text-ellipsis truncate">{t("sidebar.inner.notes.title")}</div>
				<Button
					size="sm"
					variant="secondary"
					onClick={add}
				>
					<PlusIcon />
					{t("sidebar.inner.notes.new")}
				</Button>
			</div>
			<SidebarInput placeholder="Search..." />
			<div>
				<TabsList className="h-8">
					<TabsTrigger
						className="h-6 cursor-pointer"
						value="account"
					>
						All
					</TabsTrigger>
					<TabsTrigger
						className="h-6 cursor-pointer"
						value="password"
					>
						Tags
					</TabsTrigger>
				</TabsList>
			</div>
		</SidebarHeader>
	)
})

InnerSidebarNotesHeader.displayName = "InnerSidebarNotesHeader"

export default InnerSidebarNotesHeader
