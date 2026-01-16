import Text from "@/components/ui/text"
import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import { memo, useMemo, useCallback } from "@/lib/memo"
import useChatsQuery from "@/queries/useChats.query"
import VirtualList, { type ListRenderItemInfo } from "@/components/ui/virtualList"
import type { Chat } from "@filen/sdk-rs"
import View from "@/components/ui/view"
import Avatar from "@/components/ui/avatar"
import { Platform } from "react-native"
import { PressableScale } from "@/components/ui/pressables"
import Menu from "@/components/ui/menu"
import { contactDisplayName } from "@/lib/utils"
import { parseNumbersFromString, run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { useRouter } from "expo-router"
import { Paths } from "expo-file-system"

export const Chats = memo(() => {
	const chatsQuery = useChatsQuery()
	const router = useRouter()

	const chats = useMemo(() => {
		if (chatsQuery.status !== "success") {
			return []
		}

		return chatsQuery.data.sort((a, b) => {
			const aLastMessageTimestamp = a.lastMessage ? Number(a.lastMessage.sentTimestamp) : 0
			const bLastMessageTimestamp = b.lastMessage ? Number(b.lastMessage.sentTimestamp) : 0

			if (aLastMessageTimestamp === bLastMessageTimestamp) {
				return parseNumbersFromString(b.uuid) - parseNumbersFromString(a.uuid)
			}

			return bLastMessageTimestamp - aLastMessageTimestamp
		})
	}, [chatsQuery.status, chatsQuery.data])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await chatsQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [chatsQuery])

	const keyExtractor = useCallback((chat: Chat) => {
		return chat.uuid
	}, [])

	const renderItem = useCallback(
		(info: ListRenderItemInfo<Chat>) => {
			return (
				<View className="flex-row w-full h-auto">
					<Menu
						className="flex-row w-full h-auto"
						type="context"
						isAnchoredToRight={true}
						buttons={[
							{
								id: "participants",
								title: "tbd_participants",
								icon: "users"
							},
							{
								id: "muted",
								title: "tbd_muted",
								checked: true,
								icon: "tag"
							},
							{
								id: "delete",
								title: "tbd_delete",
								destructive: true,
								icon: "delete"
							}
						]}
					>
						<PressableScale
							className="flex-row w-full h-auto"
							onPress={() => {
								router.push(Paths.join("/", "chat", info.item.uuid))
							}}
						>
							<View className="flex-row w-full h-auto items-center px-4 gap-3 bg-transparent">
								<View className="bg-blue-500 size-3 rounded-full shrink-0" />
								<Avatar
									className="shrink-0"
									size={32}
									source={{
										uri: info.item.participants.at(0)?.avatar
									}}
								/>
								<View className="flex-col border-b border-border w-full py-2 items-start gap-0.5 bg-transparent flex-1">
									<Text>{info.item.name ?? contactDisplayName(info.item.participants.at(0)!)}</Text>
									{info.item.lastMessage && (
										<Text
											numberOfLines={2}
											ellipsizeMode="tail"
											className="text-muted-foreground text-xs"
										>
											{info.item.lastMessage?.inner.message}
										</Text>
									)}
								</View>
							</View>
						</PressableScale>
					</Menu>
				</View>
			)
		},
		[router]
	)

	return (
		<Fragment>
			<Header
				title="tbd_chats"
				transparent={Platform.OS === "ios"}
			/>
			<SafeAreaView edges={["left", "right"]}>
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
			</SafeAreaView>
		</Fragment>
	)
})

export default Chats
