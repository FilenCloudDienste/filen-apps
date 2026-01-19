import Text from "@/components/ui/text"
import { memo, useMemo, useCallback } from "@/lib/memo"
import useChatsQuery from "@/queries/useChats.query"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import type { Chat as TChat } from "@filen/sdk-rs"
import View from "@/components/ui/view"
import { parseNumbersFromString, run } from "@filen/utils"
import alerts from "@/lib/alerts"
import Chat from "@/components/chats/list/chat"
import { useStringifiedClient } from "@/lib/auth"

export const List = memo(() => {
	const chatsQuery = useChatsQuery()
	const stringigiedClient = useStringifiedClient()

	const chats = useMemo(() => {
		if (chatsQuery.status !== "success") {
			return []
		}

		return chatsQuery.data
			.filter(chat => chat.ownerId === stringigiedClient?.userId || chat.lastMessage)
			.sort((a, b) => {
				const aLastMessageTimestamp = a.lastMessage ? Number(a.lastMessage.sentTimestamp) : 0
				const bLastMessageTimestamp = b.lastMessage ? Number(b.lastMessage.sentTimestamp) : 0

				if (aLastMessageTimestamp === bLastMessageTimestamp) {
					return parseNumbersFromString(b.uuid) - parseNumbersFromString(a.uuid)
				}

				return bLastMessageTimestamp - aLastMessageTimestamp
			})
	}, [chatsQuery.status, chatsQuery.data, stringigiedClient?.userId])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await chatsQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [chatsQuery])

	const keyExtractor = useCallback((chat: TChat) => {
		return chat.uuid
	}, [])

	const renderItem = useCallback((info: ListRenderItemInfo<TChat>) => {
		return <Chat info={info} />
	}, [])

	return (
		<VirtualList
			className="flex-1"
			contentInsetAdjustmentBehavior="automatic"
			contentContainerClassName="pb-40"
			keyExtractor={keyExtractor}
			data={chats}
			renderItem={renderItem}
			onRefresh={onRefresh}
			emptyComponent={() => {
				return (
					<View className="flex-1 items-center justify-center">
						<Text>tbd_no_chats</Text>
					</View>
				)
			}}
		/>
	)
})

export default List
