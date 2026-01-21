import type { Chat } from "@filen/sdk-rs"
import useChatMessagesQuery from "@/queries/useChatMessages.query"
import { useMemo } from "@/lib/memo"
import { useStringifiedClient } from "@/lib/auth"

export function useChatUnreadCount(chat: Chat): number {
	const stringifiedClient = useStringifiedClient()
	const chatMessagesQuery = useChatMessagesQuery(
		{
			uuid: chat.uuid
		},
		{
			enabled: false
		}
	)

	const unreadCount = useMemo(() => {
		if (chatMessagesQuery.status !== "success") {
			return 0
		}

		return chatMessagesQuery.data.filter(
			message => chat.lastFocus && message.sentTimestamp > chat.lastFocus && message.inner.senderId !== stringifiedClient?.userId
		).length
	}, [chatMessagesQuery.status, chatMessagesQuery.data, chat.lastFocus, stringifiedClient?.userId])

	return unreadCount
}

export default useChatUnreadCount
