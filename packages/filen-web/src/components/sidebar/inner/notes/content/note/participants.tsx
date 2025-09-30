import { memo, useMemo } from "react"
import Avatar from "@/components/avatar"
import { useAuth } from "@/hooks/useAuth"
import type { Note } from "@filen/sdk-rs"

export const Participant = memo(({ participant }: { participant: Note["participants"][0] }) => {
	return (
		<Avatar
			name={participant.email}
			src={participant.avatar}
			width={22}
			height={22}
		/>
	)
})

Participant.displayName = "Participant"

export const Participants = memo(({ note }: { note: Note }) => {
	const { client } = useAuth()

	const withoutUser = useMemo(() => {
		return note.participants.filter(participant => participant.userId !== client?.userId)
	}, [note.participants, client?.userId])

	return withoutUser.length > 0 ? (
		<div className="flex flex-row items-center gap-2 flex-wrap">
			{withoutUser
				.filter(participant => participant.userId !== client?.userId)
				.map(participant => (
					<Participant
						key={participant.userId}
						participant={participant}
					/>
				))}
		</div>
	) : null
})

Participants.displayName = "Participants"

export default Participants
