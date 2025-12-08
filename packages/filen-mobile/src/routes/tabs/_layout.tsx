import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Platform } from "react-native"
import { useResolveClassNames } from "uniwind"
import { useIsAuthed } from "@/lib/auth"
import { Redirect } from "expo-router"
import { memo } from "@/lib/memo"

export const TabsLayout = memo(() => {
	const bgBackground = useResolveClassNames("bg-background")
	const bgBackgroundSecondary = useResolveClassNames("bg-background-secondary")
	const textForeground = useResolveClassNames("text-foreground")
	const textRed500 = useResolveClassNames("text-red-500")
	const isAuthed = useIsAuthed()

	if (!isAuthed) {
		return <Redirect href="/auth/login" />
	}

	return (
		<NativeTabs
			backgroundColor={bgBackground.backgroundColor as string}
			iconColor={textForeground.color as string}
			badgeBackgroundColor={textRed500.color as string}
			rippleColor={bgBackgroundSecondary.backgroundColor as string}
			indicatorColor={bgBackgroundSecondary.backgroundColor as string}
			tintColor={textForeground.color as string}
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
