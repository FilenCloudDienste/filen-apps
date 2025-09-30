import { memo, useCallback } from "react"
import { PlusIcon } from "lucide-react"
import { SidebarHeader } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import contacts from "@/lib/contacts"
import { useTranslation } from "react-i18next"

export const Header = memo(() => {
	const { t } = useTranslation()

	const add = useCallback(() => {
		contacts.sendRequest().catch(console.error)
	}, [])

	return (
		<SidebarHeader className="gap-3.5 p-4 pb-0">
			<div className="flex w-full items-center justify-between gap-4">
				<div className="text-foreground text-base font-medium text-ellipsis truncate">{t("sidebar.inner.contacts.title")}</div>
				<Button
					size="sm"
					variant="secondary"
					onClick={add}
				>
					<PlusIcon />
					{t("sidebar.inner.contacts.add")}
				</Button>
			</div>
		</SidebarHeader>
	)
})

Header.displayName = "Header"

export default Header
