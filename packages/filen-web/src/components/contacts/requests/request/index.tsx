import { memo, useCallback, Fragment, useState, useMemo } from "react"
import { contactDisplayName } from "@/lib/utils"
import { XIcon, CheckIcon, LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Avatar from "@/components/avatar"
import contacts from "@/lib/contacts"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslation } from "react-i18next"
import type { ContactRequestIn, ContactRequestOut } from "@filen/sdk-rs"

export const ContactsRequestsListRequest = memo(
	({ request, type }: { request: ContactRequestIn | ContactRequestOut; type: "incoming" | "outgoing" }) => {
		const { t } = useTranslation()
		const [accepting, setAccepting] = useState<boolean>(false)
		const [denying, setDenying] = useState<boolean>(false)

		const loading = useMemo(() => {
			return accepting || denying
		}, [accepting, denying])

		const accept = useCallback(async () => {
			setAccepting(true)

			try {
				await contacts.acceptRequest(request.uuid)
			} catch (err) {
				console.error(err)
			} finally {
				setAccepting(false)
			}
		}, [request.uuid])

		const deny = useCallback(async () => {
			setDenying(true)

			try {
				await contacts.denyRequest(request.uuid)
			} catch (err) {
				console.error(err)
			} finally {
				setDenying(false)
			}
		}, [request.uuid])

		const cancel = useCallback(async () => {
			try {
				await contacts.cancelRequest(request.uuid)
			} catch (err) {
				console.error(err)
			}
		}, [request.uuid])

		return (
			<div className="px-4">
				<div className="flex flex-row items-center py-2 px-2 gap-8 hover:bg-sidebar hover:text-sidebar-foreground rounded-lg justify-between">
					<div className="flex flex-row items-center gap-3">
						<Avatar
							name={contactDisplayName(request)}
							src={request.avatar}
						/>
						<div className="flex flex-col">
							<p className="text-sm text-ellipsis truncate">{contactDisplayName(request)}</p>
							<p className="text-xs text-muted-foreground text-ellipsis truncate">{request.email}</p>
						</div>
					</div>
					<div className="flex flex-row items-center gap-2">
						{type === "incoming" ? (
							<Fragment>
								<Tooltip delayDuration={1000}>
									<TooltipTrigger asChild={true}>
										<Button
											size="icon"
											variant="default"
											className="rounded-full bg-green-500 text-white hover:bg-green-600 focus:bg-green-600 size-6"
											onClick={accept}
											disabled={loading}
										>
											{accepting ? <LoaderIcon className="animate-spin" /> : <CheckIcon />}
										</Button>
									</TooltipTrigger>
									<TooltipContent
										side="top"
										align="center"
										className="select-none"
									>
										{t("contacts.requests.list.request.tooltip.accept")}
									</TooltipContent>
								</Tooltip>
								<Tooltip delayDuration={1000}>
									<TooltipTrigger asChild={true}>
										<Button
											size="icon"
											variant="destructive"
											onClick={deny}
											disabled={loading}
											className="rounded-full bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 size-6"
										>
											{denying ? <LoaderIcon className="animate-spin" /> : <XIcon />}
										</Button>
									</TooltipTrigger>
									<TooltipContent
										side="top"
										align="center"
										className="select-none"
									>
										{t("contacts.requests.list.request.tooltip.deny")}
									</TooltipContent>
								</Tooltip>
							</Fragment>
						) : (
							<Tooltip delayDuration={1000}>
								<TooltipTrigger asChild={true}>
									<Button
										size="icon"
										variant="destructive"
										onClick={cancel}
										disabled={loading}
										className="rounded-full bg-red-500 text-white hover:bg-red-600 focus:bg-red-600 size-6"
									>
										<XIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="top"
									align="center"
									className="select-none"
								>
									{t("contacts.requests.list.request.tooltip.cancel")}
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</div>
			</div>
		)
	}
)

ContactsRequestsListRequest.displayName = "ContactsRequestsListRequest"

export default ContactsRequestsListRequest
