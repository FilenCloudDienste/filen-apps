import { memo } from "@/lib/memo"
import events from "@/lib/events"
import { useEffect } from "react"
import { runEffect } from "@filen/utils"
import { ActionSheetProvider as ExpoActionSheetProvider, useActionSheet } from "@expo/react-native-action-sheet"
import { useResolveClassNames, useUniwind } from "uniwind"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export const ActionSheetProviderInner = memo(({ children }) => {
	const { showActionSheetWithOptions } = useActionSheet()
	const bgBackgroundSecondary = useResolveClassNames("bg-background-secondary")
	const { theme } = useUniwind()
	const insets = useSafeAreaInsets()

	useEffect(() => {
		const { cleanup } = runEffect(defer => {
			const showActionSheetListener = events.subscribe("showActionSheet", () => {
				const options = ["Delete", "Save", "Cancel"]
				const destructiveButtonIndex = 0
				const cancelButtonIndex = 2

				showActionSheetWithOptions(
					{
						options,
						cancelButtonIndex,
						destructiveButtonIndex,
						containerStyle: {
							backgroundColor: bgBackgroundSecondary.backgroundColor,
							borderTopLeftRadius: 16,
							borderTopRightRadius: 16,
							paddingBottom: insets.bottom,
							paddingLeft: insets.left,
							paddingRight: insets.right
						},
						userInterfaceStyle: theme === "dark" ? "dark" : "light"
					},
					(selectedIndex?: number) => {
						switch (selectedIndex) {
							case 1:
								// Save
								break

							case destructiveButtonIndex:
								// Delete
								break

							case cancelButtonIndex:
							// Canceled
						}
					}
				)
			})

			defer(() => {
				showActionSheetListener.remove()
			})
		})

		return () => {
			cleanup()
		}
	}, [showActionSheetWithOptions, bgBackgroundSecondary.backgroundColor, theme, insets.bottom, insets.left, insets.right])

	return children
})

export const ActionSheetProvider = memo(({ children }: { children: React.ReactNode }) => {
	return (
		<ExpoActionSheetProvider>
			<ActionSheetProviderInner>{children}</ActionSheetProviderInner>
		</ExpoActionSheetProvider>
	)
})

export class ActionSheet {
	public async show() {
		events.emit("showActionSheet")
	}
}

export const actionSheet = new ActionSheet()

export default ActionSheetProvider
