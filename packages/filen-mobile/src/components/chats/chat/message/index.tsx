import type { Chat as TChat, ChatMessage } from "@filen/sdk-rs"
import { memo, useMemo } from "@/lib/memo"
import View from "@/components/ui/view"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import Text from "@/components/ui/text"
import { cn, isTimestampSameMinute } from "@filen/utils"
import { useStringifiedClient } from "@/lib/auth"
import Menu from "@/components/ui/menu"
import { useSecureStore } from "@/lib/secureStore"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn } from "react-native-reanimated"
import useChatsStore from "@/stores/useChats.store"
import { useShallow } from "zustand/shallow"
import { contactDisplayName } from "@/lib/utils"
import { Fragment } from "react"
import { simpleDate } from "@/lib/time"
import isEqual from "react-fast-compare"

export const Typing = memo(
	({ chat }: { chat: TChat }) => {
		const typing = useChatsStore(useShallow(state => state.typing[chat.uuid] ?? []))

		const users = useMemo(() => {
			return typing
				.map(t => t.senderId)
				.map(senderId => chat.participants.find(p => p.userId === senderId))
				.filter(Boolean)
				.map(participant => contactDisplayName(participant!))
		}, [typing, chat.participants])

		if (users.length === 0) {
			return null
		}

		return (
			<AnimatedView
				entering={FadeIn.delay(100)}
				className="w-full h-auto pb-2 px-4 items-start"
			>
				<View className="p-3 rounded-3xl max-w-3/4 bg-background-secondary">
					<Text className="text-xs">{users.length > 1 ? `${users.join(", ")} tbd_typing...` : "..."}</Text>
				</View>
			</AnimatedView>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.chat.uuid === nextProps.chat.uuid && isEqual(prevProps.chat.participants, nextProps.chat.participants)
	}
)

export const Message = memo(
	({
		chat,
		info,
		nextMessage,
		prevMessage
	}: {
		chat: TChat
		info: ListRenderItemInfo<ChatMessage>
		nextMessage?: ChatMessage
		prevMessage?: ChatMessage
	}) => {
		const stringifiedClient = useStringifiedClient()
		const [, setChatReplyTo] = useSecureStore<ChatMessage | null>(`chatReplyTo:${chat.uuid}`, null)

		return (
			<View
				className="w-full h-auto"
				style={{
					transform: [
						{
							scaleY: -1
						}
					]
				}}
			>
				{prevMessage?.inner.senderId !== info.item.inner.senderId &&
					!isTimestampSameMinute(Number(prevMessage?.sentTimestamp ?? 0), Number(info.item.sentTimestamp)) && (
						<View className="w-full items-center justify-center py-2">
							<Text
								className="text-xs text-muted-foreground"
								numberOfLines={1}
								ellipsizeMode="middle"
							>
								{simpleDate(Number(info.item.sentTimestamp))}
							</Text>
						</View>
					)}
				{chat.participants.length > 2 &&
					nextMessage?.inner.senderId !== info.item.inner.senderId &&
					info.item.inner.senderId !== stringifiedClient?.userId && (
						<View className="max-w-3/4 flex-row items-center px-4 pb-1 pl-6">
							<Text className="text-xs text-muted-foreground">
								{contactDisplayName(chat.participants.find(p => p.userId === info.item.inner.senderId)!)}
							</Text>
						</View>
					)}
				<Menu
					type="context"
					buttons={[
						{
							id: "reply",
							title: "tbd_reply",
							onPress: () => {
								setChatReplyTo(info.item)
							}
						}
					]}
					className={cn(
						"w-full h-auto pb-2 px-4",
						info.item.inner.senderId === stringifiedClient?.userId ? "items-end" : "items-start"
					)}
				>
					<View
						className={cn(
							"p-3 rounded-3xl max-w-3/4",
							info.item.inner.senderId === stringifiedClient?.userId ? "bg-blue-500" : "bg-background-secondary"
						)}
					>
						{nextMessage?.inner.senderId !== info.item.inner.senderId && (
							<Fragment>
								{info.item.inner.senderId === stringifiedClient?.userId ? (
									<View className="absolute right-2 -bottom-1.75 overflow-hidden bg-transparent w-5 h-3.75">
										<View className="bg-blue-500 absolute size-6.5 bottom-0 -right-3.25 rounded-[13px]" />
									</View>
								) : (
									<View
										className="absolute left-2 -bottom-1.75 overflow-hidden bg-transparent w-5 h-3.75"
										style={{
											transform: [
												{
													scaleX: -1
												}
											]
										}}
									>
										<View className="bg-background-secondary absolute size-6.5 bottom-0 -right-3.25 rounded-[13px]" />
									</View>
								)}
							</Fragment>
						)}
						<Text>{info.item.inner.message}</Text>
					</View>
				</Menu>
				{!nextMessage && <Typing chat={chat} />}
			</View>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.chat.uuid === nextProps.chat.uuid &&
			isEqual(prevProps.chat.participants, nextProps.chat.participants) &&
			isEqual(prevProps.info.item, nextProps.info.item) &&
			prevProps.prevMessage?.sentTimestamp === nextProps.prevMessage?.sentTimestamp &&
			prevProps.prevMessage?.inner.senderId === nextProps.prevMessage?.inner.senderId &&
			nextProps.nextMessage?.inner.senderId === prevProps.nextMessage?.inner.senderId
		)
	}
)

export default Message
