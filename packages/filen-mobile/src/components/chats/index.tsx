import { Fragment, useState } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { memo, useMemo, useCallback } from "@/lib/memo"
import { Platform, TextInput } from "react-native"
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
import View, { KeyboardAvoidingView } from "@/components/ui/view"

const Header = memo(
	({ withSearch, setSearchQuery }: { withSearch?: boolean; setSearchQuery?: React.Dispatch<React.SetStateAction<string>> }) => {
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

		const chatsQuery = useChatsQuery({
			enabled: false
		})

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
				title={withSearch ? "tbd_search_chats" : "tbd_chats"}
				transparent={Platform.OS === "ios" && !withSearch}
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
						...(!withSearch
							? [
									{
										type: "button" as const,
										props: {
											hitSlop: 20,
											onPress: () => {
												useChatsStore.getState().setSelectedChats([])

												router.push(Paths.join("/", "search", "chats"))
											}
										},
										icon: {
											name: "search" as const,
											size: 24,
											color: textForeground.color
										}
									}
								]
							: []),
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
												...(!withSearch
													? [
															{
																id: "createChat",
																title: "tbd_create_chat",
																icon: "plus" as const,
																onPress: async () => {
																	await createChat()
																}
															}
														]
													: [])
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
				searchBarOptions={
					withSearch && setSearchQuery
						? Platform.select({
								ios: {
									placeholder: "tbd_search_chats",
									onChangeText(e) {
										setSearchQuery(e.nativeEvent.text)
									},
									autoFocus: true,
									autoCapitalize: "none",
									placement: "stacked"
								},
								default: undefined
							})
						: undefined
				}
			/>
		)
	}
)

const SearchWrapper = memo(
	({
		children,
		setSearchQuery,
		enabled
	}: {
		children: React.ReactNode
		setSearchQuery: React.Dispatch<React.SetStateAction<string>>
		enabled?: boolean
	}) => {
		if (!enabled) {
			return children
		}

		return (
			<KeyboardAvoidingView
				className="flex-1 flex-col"
				behavior="padding"
			>
				{Platform.select({
					android: (
						<View className="px-4 py-2 shrink-0">
							<TextInput
								className="bg-background-secondary px-5 py-4 rounded-full"
								placeholder="tbd_search_chats"
								onChangeText={setSearchQuery}
								autoCapitalize="none"
								autoCorrect={false}
								spellCheck={false}
								returnKeyType="search"
								autoComplete="off"
								autoFocus={true}
							/>
						</View>
					),
					default: null
				})}

				{children}
			</KeyboardAvoidingView>
		)
	}
)

export const Chats = memo(({ withSearch }: { withSearch?: boolean }) => {
	const [searchQuery, setSearchQuery] = useState<string>("")

	return (
		<Fragment>
			<Header
				withSearch={withSearch}
				setSearchQuery={setSearchQuery}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<SearchWrapper
					enabled={withSearch}
					setSearchQuery={setSearchQuery}
				>
					<List searchQuery={searchQuery} />
				</SearchWrapper>
			</SafeAreaView>
		</Fragment>
	)
})

export default Chats
