import { Fragment, useEffect } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { useLocalSearchParams, Redirect, useRouter } from "expo-router"
import type { Chat as TChat } from "@filen/sdk-rs"
import { Platform, ActivityIndicator } from "react-native"
import { memo, useMemo } from "@/lib/memo"
import useChatsQuery from "@/queries/useChats.query"
import View, { CrossGlassContainerView } from "@/components/ui/view"
import Text from "@/components/ui/text"
import { useResolveClassNames } from "uniwind"
import { cn, fastLocaleCompare, runEffect } from "@filen/utils"
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller"
import { AnimatedView } from "@/components/ui/animated"
import { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { contactDisplayName } from "@/lib/utils"
import { useStringifiedClient } from "@/lib/auth"
import Avatar from "@/components/ui/avatar"
import { useShallow } from "zustand/shallow"
import Input from "@/components/chats/chat/input"
import events from "@/lib/events"
import useSocketStore from "@/stores/useSocket.store"
import Messages from "@/components/chats/chat/messages"
import { createMenuButtons } from "@/components/chats/list/chat/menu"

export const Header = memo(({ chat }: { chat: TChat }) => {
	const stringigiedClient = useStringifiedClient()
	const textForeground = useResolveClassNames("text-foreground")

	const title = useMemo(() => {
		if (chat.name && chat.name.length > 0) {
			return chat.name
		}

		if (chat.participants.length === 2) {
			const otherParticipant = chat.participants.find(p => p.userId !== stringigiedClient?.userId)

			if (otherParticipant) {
				return contactDisplayName(otherParticipant)
			}
		}

		return chat.participants
			.filter(p => p.userId !== stringigiedClient?.userId)
			.sort((a, b) => fastLocaleCompare(contactDisplayName(a), contactDisplayName(b)))
			.map(p => contactDisplayName(p))
			.join(", ")
	}, [chat.name, chat.participants, stringigiedClient?.userId])

	const avatar = useMemo(() => {
		if (chat.participants.length === 2) {
			const otherParticipant = chat.participants.find(p => p.userId !== stringigiedClient?.userId)

			if (otherParticipant && otherParticipant.avatar && otherParticipant.avatar.startsWith("http")) {
				return otherParticipant.avatar
			}
		}

		return undefined
	}, [chat.participants, stringigiedClient?.userId])

	return (
		<StackHeader
			title={
				avatar
					? () => {
							return (
								<View
									className={cn(
										"items-center flex-col justify-center bg-transparent gap-0.5",
										Platform.OS === "android" && "py-2"
									)}
								>
									<Avatar
										className="shrink-0 z-100 size-9"
										size={36}
										source={{
											uri: avatar
										}}
									/>
									<CrossGlassContainerView
										className="bg-background-secondary border border-border py-0.5 px-1.5 rounded-full max-w-32 -mt-1.5"
										disableBlur={Platform.OS === "android"}
									>
										<Text
											className="text-foreground"
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{title}
										</Text>
									</CrossGlassContainerView>
								</View>
							)
						}
					: title
			}
			backVisible={true}
			transparent={false}
			shadowVisible={true}
			backTitle="tbd_back"
			rightItems={() => {
				if (!stringigiedClient) {
					return []
				}

				return [
					{
						type: "menu",
						props: {
							type: "dropdown",
							hitSlop: 20,
							buttons: createMenuButtons({
								chat,
								userId: stringigiedClient.userId
							})
						},
						triggerProps: {
							hitSlop: 20
						},
						icon: {
							name: "ellipsis-horizontal",
							size: 24,
							color: textForeground.color
						}
					}
				]
			}}
		/>
	)
})

export const Chat = memo(() => {
	const { uuid } = useLocalSearchParams<{
		uuid: string
	}>()
	const keyboardAnimation = useReanimatedKeyboardAnimation()
	const router = useRouter()
	const socketState = useSocketStore(useShallow(state => state.state))
	const textForeground = useResolveClassNames("text-foreground")

	const chatsQuery = useChatsQuery({
		enabled: false
	})

	const chat = useMemo(() => {
		return chatsQuery.data?.find(c => c.uuid === uuid) as TChat
	}, [chatsQuery.data, uuid])

	const containerStyle = useAnimatedStyle(() => {
		return {
			paddingBottom: interpolate(
				keyboardAnimation.progress.value,
				[0, 1],
				[8, -keyboardAnimation.height.value + (Platform.OS === "ios" ? -10 : 0) + 8]
			)
		}
	}, [keyboardAnimation])

	useEffect(() => {
		const { cleanup } = runEffect(defer => {
			const chatConversationDeletedSubscription = events.subscribe("chatConversationDeleted", info => {
				if (info.uuid !== uuid || !router.canGoBack()) {
					return
				}

				router.replace("/tabs/chats")
			})

			defer(() => {
				chatConversationDeletedSubscription.remove()
			})
		})

		return () => {
			cleanup()
		}
	}, [uuid, router])

	if (!(chat as TChat | undefined)) {
		return <Redirect href="/tabs/chats" />
	}

	return (
		<Fragment>
			<Header chat={chat} />
			<SafeAreaView edges={["left", "right"]}>
				<AnimatedView
					className="flex-1 bg-transparent"
					style={containerStyle}
				>
					{socketState !== "connected" && (
						<View className="absolute top-0 left-0 right-0 items-center z-10 bg-red-500 py-1 flex-row justify-center gap-2">
							<ActivityIndicator
								size="small"
								color={textForeground.color}
							/>
							<Text
								className="text-foreground"
								numberOfLines={1}
								ellipsizeMode="middle"
							>
								{socketState === "disconnected" ? "tbd_disconnected" : "tbd_reconnecting"}
							</Text>
						</View>
					)}
					<Messages chat={chat} />
				</AnimatedView>
			</SafeAreaView>
			<Input chat={chat} />
		</Fragment>
	)
})

export default Chat
