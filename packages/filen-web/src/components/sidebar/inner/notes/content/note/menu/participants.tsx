import type { Note, NoteParticipant } from "@filen/sdk-rs"
import { memo, useCallback, useState, Fragment, useMemo } from "react"
import { contactDisplayName } from "@/lib/utils"
import libNotes from "@/lib/notes"
import toasts from "@/lib/toasts"
import { LoaderIcon, EyeIcon, EditIcon, DeleteIcon } from "lucide-react"
import Avatar from "@/components/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export const Participant = memo(({ note, participant, isOwner }: { note: Note; participant: NoteParticipant; isOwner: boolean }) => {
	const [settingParticipantPermissions, setSettingParticipantPermissions] = useState<NoteParticipant | null>(null)

	const displayName = useMemo(() => contactDisplayName(participant), [participant])

	const togglePermissions = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			if (settingParticipantPermissions?.userId === participant.userId) {
				return
			}

			setSettingParticipantPermissions(participant)

			try {
				await libNotes.setParticipantsPermissions(note, [
					{
						participant,
						permissionsWrite: !participant.permissionsWrite
					}
				])
			} catch (e) {
				console.error(e)
				toasts.error(e)
			} finally {
				setSettingParticipantPermissions(null)
			}
		},
		[note, participant, settingParticipantPermissions]
	)

	const remove = useCallback(
		async (e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()

			try {
				await libNotes.removeParticipants(note, [participant])
			} catch (e) {
				console.error(e)
				toasts.error(e)
			}
		},
		[note, participant]
	)

	return (
		<div className="flex flex-row items-center gap-8 overflow-hidden justify-between w-full">
			<div className="flex flex-row items-center gap-2 flex-1 overflow-hidden max-w-[25dvw]">
				<Avatar
					name={displayName}
					src={participant.avatar}
					width={20}
					height={20}
				/>
				<p className="truncate">{displayName}</p>
			</div>
			{isOwner && (
				<div className="flex flex-row items-center gap-2">
					<Badge
						className="shrink-0 cursor-pointer"
						onClick={togglePermissions}
					>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div>
									{settingParticipantPermissions?.userId === participant.userId ? (
										<LoaderIcon className="size-[14px] animate-spin shrink-0" />
									) : (
										<Fragment>
											{participant.permissionsWrite ? (
												<EyeIcon className="size-[14px] cursor-pointer shrink-0" />
											) : (
												<EditIcon className="size-[14px] cursor-pointer shrink-0" />
											)}
										</Fragment>
									)}
								</div>
							</TooltipTrigger>
							<TooltipContent>{participant.permissionsWrite ? "tdb" : "tdb"}</TooltipContent>
						</Tooltip>
					</Badge>
					<Badge
						className="shrink-0 cursor-pointer"
						variant="destructive"
						onClick={remove}
					>
						<Tooltip>
							<TooltipTrigger asChild={true}>
								<div>
									<DeleteIcon className="size-[14px] cursor-pointer" />
								</div>
							</TooltipTrigger>
							<TooltipContent>tdb</TooltipContent>
						</Tooltip>
					</Badge>
				</div>
			)}
		</div>
	)
})

Participant.displayName = "Participant"
