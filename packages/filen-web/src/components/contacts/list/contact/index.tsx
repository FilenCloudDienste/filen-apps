import { memo } from "react"
import { contactDisplayName } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EllipsisVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Contact as FilenSdkRsContact } from "@filen/sdk-rs"

export const Contact = memo(({ contact }: { contact: FilenSdkRsContact }) => {
	return (
		<div className="px-4">
			<div className="flex flex-row items-center py-2 px-2 gap-8 hover:bg-sidebar hover:text-sidebar-foreground rounded-lg justify-between">
				<div className="flex flex-row items-center gap-3">
					<Avatar className="size-9 rounded-lg">
						<AvatarImage
							crossOrigin="anonymous"
							src={contact.avatar}
							alt={contactDisplayName(contact)}
							className="rounded-full"
						/>
						<AvatarFallback className="rounded-full">
							{contactDisplayName(contact).substring(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<p className="text-sm text-ellipsis truncate">{contactDisplayName(contact)}</p>
						<p className="text-xs text-muted-foreground text-ellipsis truncate">{contact.email}</p>
					</div>
				</div>
				<Button
					size="icon"
					variant="ghost"
				>
					<EllipsisVerticalIcon />
				</Button>
			</div>
		</div>
	)
})

Contact.displayName = "Contact"

export default Contact
