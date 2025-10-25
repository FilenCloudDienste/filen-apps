import { memo } from "react"
import { NativeTabs, Icon, Label, VectorIcon } from "expo-router/unstable-native-tabs"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Platform } from "react-native"

export const TabsLayout = memo(() => {
	return (
		<NativeTabs>
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
