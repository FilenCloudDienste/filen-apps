import { NativeTabs, Icon, Label, VectorIcon, Badge } from "expo-router/unstable-native-tabs"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Platform, AppState } from "react-native"
import { useResolveClassNames } from "uniwind"
import { useIsAuthed, useStringifiedClient } from "@/lib/auth"
import { Redirect } from "expo-router"
import { memo, useMemo } from "@/lib/memo"
import useChatsQuery from "@/queries/useChats.query"
import { chatMessagesQueryGet } from "@/queries/useChatMessages.query"
import { useEffect } from "react"
import { runEffect } from "@filen/utils"
import useEffectOnce from "@/hooks/useEffectOnce"
import chats from "@/lib/chats"

export const TabsLayout = memo(() => {
	const bgBackground = useResolveClassNames("bg-background")
	const bgBackgroundSecondary = useResolveClassNames("bg-background-secondary")
	const textForeground = useResolveClassNames("text-foreground")
	const textRed500 = useResolveClassNames("text-red-500")
	const isAuthed = useIsAuthed()
	const stringifiedClient = useStringifiedClient()

	const chatsQuery = useChatsQuery({
		enabled: false
	})

	const unreadCount = useMemo(() => {
		if (chatsQuery.status !== "success" || !isAuthed) {
			return 0
		}

		let unreadCount = 0

		for (const chat of chatsQuery.data) {
			const messages = chatMessagesQueryGet({
				uuid: chat.uuid
			})

			if (!messages) {
				chats.refetchChatsAndMessages().catch(console.error)

				continue
			}

			if (messages.length === 0) {
				continue
			}

			unreadCount += messages.filter(
				message => chat.lastFocus && message.sentTimestamp > chat.lastFocus && message.inner.senderId !== stringifiedClient?.userId
			).length
		}

		return unreadCount
	}, [chatsQuery.status, chatsQuery.data, isAuthed, stringifiedClient?.userId])

	useEffect(() => {
		const { cleanup } = runEffect(defer => {
			const appStateSubscription = AppState.addEventListener("change", async nextAppState => {
				if (nextAppState === "active") {
					chats.refetchChatsAndMessages().catch(console.error)
				}
			})

			defer(() => {
				appStateSubscription.remove()
			})
		})

		return () => {
			cleanup()
		}
	}, [])

	useEffectOnce(() => {
		if (!isAuthed) {
			return
		}

		chats.refetchChatsAndMessages().catch(console.error)
	})

	if (!isAuthed) {
		return <Redirect href="/auth/login" />
	}

	return (
		<NativeTabs
			backgroundColor={bgBackground.backgroundColor}
			iconColor={textForeground.color}
			badgeBackgroundColor={textRed500.color}
			rippleColor={bgBackgroundSecondary.backgroundColor}
			indicatorColor={bgBackgroundSecondary.backgroundColor}
			tintColor={textForeground.color}
		>
			<NativeTabs.Trigger name="drive">
				<Label>tbd</Label>
				{Platform.select({
					ios: <Icon sf="folder.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="folder"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="photos">
				<Label>tbd</Label>
				{Platform.select({
					ios: <Icon sf="photo.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="photo-library"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="notes">
				<Label>tbd</Label>
				{Platform.select({
					ios: <Icon sf="note.text" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="book"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="chats">
				<Label>tbd</Label>
				{unreadCount > 0 && <Badge>{unreadCount.toString()}</Badge>}
				{Platform.select({
					ios: <Icon sf="message.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="messenger"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<Label>tbd</Label>
				{Platform.select({
					ios: <Icon sf="gearshape.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="settings"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
})

export default TabsLayout
