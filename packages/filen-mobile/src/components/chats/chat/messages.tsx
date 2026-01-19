import { useRef } from "react"
import type { Chat as TChat } from "@filen/sdk-rs"
import { memo, useMemo, useCallback } from "@/lib/memo"
import View from "@/components/ui/view"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import useChatMessagesQuery from "@/queries/useChatMessages.query"
import VirtualList, { type ListRenderItemInfo, type ListRef } from "@/components/ui/virtualList"
import Text from "@/components/ui/text"
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller"
import { AnimatedView } from "@/components/ui/animated"
import { interpolate, useAnimatedStyle } from "react-native-reanimated"
import useChatsStore, { type ChatMessageWithInflightId } from "@/stores/useChats.store"
import { useShallow } from "zustand/shallow"
import Message from "@/components/chats/chat/message"
import isEqual from "react-fast-compare"

export const Messages = memo(
	({ chat }: { chat: TChat }) => {
		const insets = useSafeAreaInsets()
		const keyboardAnimation = useReanimatedKeyboardAnimation()
		const inputViewLayout = useChatsStore(useShallow(state => state.inputViewLayout))
		const listRef = useRef<ListRef<ChatMessageWithInflightId>>(null)
		const inflightChatMessages = useChatsStore(useShallow(state => state.inflightMessages[chat.uuid]?.messages ?? []))

		const chatMessagesQuery = useChatMessagesQuery(
			{
				uuid: chat.uuid
			},
			{
				enabled: !!chat
			}
		)

		const messages = useMemo(() => {
			if (chatMessagesQuery.status !== "success") {
				return []
			}

			return [...chatMessagesQuery.data, ...inflightChatMessages].sort((a, b) => Number(b.sentTimestamp) - Number(a.sentTimestamp))
		}, [chatMessagesQuery.data, chatMessagesQuery.status, inflightChatMessages])

		const headerStyle = useAnimatedStyle(() => {
			const standardHeight = insets.bottom + inputViewLayout.height + 16

			return {
				height: interpolate(keyboardAnimation.progress.value, [0, 1], [standardHeight, standardHeight - 16]),
				width: "100%",
				backgroundColor: "transparent"
			}
		}, [insets.bottom, keyboardAnimation, inputViewLayout.height])

		const renderItem = useCallback(
			(info: ListRenderItemInfo<ChatMessageWithInflightId>) => {
				if (!chat) {
					return null
				}

				return (
					<Message
						chat={chat}
						info={info}
						nextMessage={messages[info.index - 1]}
						prevMessage={messages[info.index + 1]}
					/>
				)
			},
			[chat, messages]
		)

		const keyExtractor = useCallback((item: ChatMessageWithInflightId) => {
			return item.inner.uuid
		}, [])

		return (
			<View
				className="bg-transparent flex-1"
				style={{
					transform: [
						{
							scaleY: -1
						}
					]
				}}
			>
				<VirtualList
					ref={listRef}
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="android:pb-8"
					keyExtractor={keyExtractor}
					data={messages}
					renderItem={renderItem}
					maintainVisibleContentPosition={{
						disabled: true
					}}
					headerComponent={() => {
						return <AnimatedView style={headerStyle} />
					}}
					emptyComponent={() => {
						return (
							<View
								className="flex-1 items-center justify-center"
								style={{
									transform: [
										{
											scaleY: -1
										}
									]
								}}
							>
								<Text>tbd_no_messages</Text>
							</View>
						)
					}}
				/>
			</View>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.chat.uuid === nextProps.chat.uuid && isEqual(prevProps.chat.participants, nextProps.chat.participants)
	}
)

export default Messages
