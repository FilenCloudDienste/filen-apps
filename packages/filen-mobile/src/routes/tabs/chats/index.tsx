import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { memo, useMemo, useCallback } from "@/lib/memo"
import { Platform } from "react-native"
import List from "@/components/chats/list"
import { useShallow } from "zustand/shallow"
import useChatsStore from "@/stores/useChats.store"
import useChatsQuery from "@/queries/useChats.query"
import { useStringifiedClient } from "@/lib/auth"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { Paths } from "expo-file-system"
import chatsLib from "@/lib/chats"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import alerts from "@/lib/alerts"
import { run } from "@filen/utils"
import prompts from "@/lib/prompts"

const Header = memo(() => {
	const chatsQuery = useChatsQuery()
	const stringigiedClient = useStringifiedClient()
	const selectedChats = useChatsStore(useShallow(state => state.selectedChats))
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const selectedChatsIncludesMuted = useChatsStore(useShallow(state => state.selectedChats.some(chat => chat.muted)))
	const everySelectedChatOwnedBySelf = useChatsStore(
		useShallow(state => state.selectedChats.every(chat => chat.ownerId === stringigiedClient?.userId))
	)
	const everySelectedChatNotOwnedBySelf = useChatsStore(
		useShallow(state => state.selectedChats.every(chat => chat.ownerId !== stringigiedClient?.userId))
	)

	const chats = useMemo(() => {
		if (chatsQuery.status !== "success") {
			return []
		}

		return chatsQuery.data.filter(chat => chat.ownerId === stringigiedClient?.userId || chat.lastMessage)
	}, [chatsQuery.status, chatsQuery.data, stringigiedClient?.userId])

	const createChat = useCallback(async () => {
		// TODO
	}, [])

	return (
		<StackHeader
			title="tbd_chats"
			transparent={Platform.OS === "ios"}
			leftItems={() => {
				if (selectedChats.length === 0) {
					return null
				}

				return [
					{
						type: "button",
						props: {
							hitSlop: 20,
							onPress: () => {
								if (selectedChats.length === chats.length) {
									useChatsStore.getState().setSelectedChats([])

									return
								}

								useChatsStore.getState().setSelectedChats(chats)
							}
						},
						text: {
							children: selectedChats.length === chats.length ? "tbd_deselectAll" : "tbd_selectAll"
						}
					}
				]
			}}
			rightItems={() => {
				return [
					{
						type: "button",
						props: {
							hitSlop: 20,
							onPress: () => {
								useChatsStore.getState().setSelectedChats([])

								router.push(Paths.join("/", "search", "notes"))
							}
						},
						icon: {
							name: "search",
							size: 24,
							color: textForeground.color
						}
					},
					{
						type: "menu",
						props: {
							type: "dropdown",
							hitSlop: 20,
							buttons: [
								...(selectedChats.length > 0
									? [
											{
												id: "bulkMute",
												title: selectedChatsIncludesMuted ? "tbd_unmute_all" : "tbd_mute_all",
												icon: "plus" as const,
												onPress: async () => {
													const result = await runWithLoading(async defer => {
														defer(() => {
															useChatsStore.getState().setSelectedChats([])
														})

														return await Promise.all(
															selectedChats.map(chat =>
																chatsLib.mute({
																	chat,
																	mute: !selectedChatsIncludesMuted
																})
															)
														)
													})

													if (!result.success) {
														console.error(result.error)
														alerts.error(result.error)

														return
													}
												}
											},
											...(everySelectedChatOwnedBySelf
												? [
														{
															id: "bulkDelete",
															title: "tbd_delete_chats",
															icon: "delete" as const,
															onPress: async () => {
																const promptResponse = await run(async () => {
																	return await prompts.alert({
																		title: "tbd_delete_all_chats",
																		message: "tbd_delete_all_chats_confirmation",
																		cancelText: "tbd_cancel",
																		okText: "tbd_delete_all"
																	})
																})

																if (!promptResponse.success) {
																	console.error(promptResponse.error)
																	alerts.error(promptResponse.error)

																	return
																}

																if (promptResponse.data.cancelled) {
																	useChatsStore.getState().setSelectedChats([])

																	return
																}

																const result = await runWithLoading(async defer => {
																	defer(() => {
																		useChatsStore.getState().setSelectedChats([])
																	})

																	return await Promise.all(
																		selectedChats.map(chat =>
																			chatsLib.delete({
																				chat
																			})
																		)
																	)
																})

																if (!result.success) {
																	console.error(result.error)
																	alerts.error(result.error)

																	return
																}
															}
														}
													]
												: []),
											...(everySelectedChatNotOwnedBySelf
												? [
														{
															id: "bulkDelete",
															title: "tbd_delete_chats",
															icon: "delete" as const,
															onPress: async () => {
																const promptResponse = await run(async () => {
																	return await prompts.alert({
																		title: "tbd_leave_all_chats",
																		message: "tbd_leave_all_chats_confirmation",
																		cancelText: "tbd_cancel",
																		okText: "tbd_leave_all"
																	})
																})

																if (!promptResponse.success) {
																	console.error(promptResponse.error)
																	alerts.error(promptResponse.error)

																	return
																}

																if (promptResponse.data.cancelled) {
																	useChatsStore.getState().setSelectedChats([])

																	return
																}

																const result = await runWithLoading(async defer => {
																	defer(() => {
																		useChatsStore.getState().setSelectedChats([])
																	})

																	return await Promise.all(
																		selectedChats.map(chat =>
																			chatsLib.leave({
																				chat
																			})
																		)
																	)
																})

																if (!result.success) {
																	console.error(result.error)
																	alerts.error(result.error)

																	return
																}
															}
														}
													]
												: [])
										]
									: [
											{
												id: "selectAllChats",
												title: "tbd_select_all_chats",
												icon: "plus" as const,
												onPress: () => {
													useChatsStore.getState().setSelectedChats(chats)
												}
											},
											{
												id: "createChat",
												title: "tbd_create_chat",
												icon: "plus" as const,
												onPress: async () => {
													await createChat()
												}
											}
										])
							]
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

export const Chats = memo(() => {
	return (
		<Fragment>
			<Header />
			<SafeAreaView edges={["left", "right"]}>
				<List />
			</SafeAreaView>
		</Fragment>
	)
})

export default Chats
