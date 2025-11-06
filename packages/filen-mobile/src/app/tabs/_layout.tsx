import { memo } from "react"
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Platform } from "react-native"
import { useResolveClassNames } from "uniwind"
import { useIsAuthed } from "@/lib/auth"
import { Redirect } from "expo-router"

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
			<NativeTabs.Trigger name="home">
				<Label>Home</Label>
				{Platform.select({
					ios: <Icon sf="house.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="home"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="drive">
				<Label>Drive</Label>
				{Platform.select({
					ios: <Icon sf="folder.fill" />,
					default: (
						<Icon
							src={
								<VectorIcon
									family={MaterialIcons}
									name="folder-open"
								/>
							}
						/>
					)
				})}
			</NativeTabs.Trigger>
		</NativeTabs>
	)
})

TabsLayout.displayName = "TabsLayout"

export default TabsLayout
