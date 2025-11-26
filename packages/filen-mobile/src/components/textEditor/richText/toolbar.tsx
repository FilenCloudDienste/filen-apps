import { useEffect, useRef, Fragment } from "react"
import View, { KeyboardStickyView, BlurView } from "@/components/ui/view"
import { type View as RNView } from "react-native"
import { useResolveClassNames, useUniwind } from "uniwind"
import { PressableScale } from "@/components/ui/pressables"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import useViewLayout from "@/hooks/useViewLayout"
import { useKeyboardState } from "react-native-keyboard-controller"
import FontAwesome6 from "@expo/vector-icons/FontAwesome6"
import Menu, { type MenuButton } from "@/components/ui/menu"
import useRichtextStore from "@/stores/useRichtext.store"
import { useShallow } from "zustand/shallow"
import type { TextEditorEvents } from "@/components/textEditor"
import type { QuillFormats } from "@/components/textEditor/richText/dom"
import Text from "@/components/ui/text"
import prompts from "@/lib/prompts"
import * as Linking from "expo-linking"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import useTextEditorStore from "@/stores/useTextEditor.store"
import { memo, useCallback, useMemo } from "@/lib/memo"

const ICON_SIZE = 18

export const Button = memo(
	({ type, postMessage }: { type: keyof QuillFormats | "keyboard"; postMessage: (message: TextEditorEvents) => void }) => {
		const formats = useRichtextStore(useShallow(state => state.formats))
		const textForeground = useResolveClassNames("text-foreground")
		const textPrimary = useResolveClassNames("text-primary")
		const keyboardState = useKeyboardState()
		const { theme } = useUniwind()

		const menuButtons = useMemo((): MenuButton[] => {
			if (!keyboardState.isVisible) {
				return []
			}

			switch (type) {
				case "header": {
					return [
						{
							id: "header-1",
							title: "1",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 1
								})
							}
						},
						{
							id: "header-2",
							title: "2",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 2
								})
							}
						},
						{
							id: "header-3",
							title: "3",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 3
								})
							}
						},
						{
							id: "header-4",
							title: "4",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 4
								})
							}
						},
						{
							id: "header-5",
							title: "5",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 5
								})
							}
						},
						{
							id: "header-6",
							title: "6",
							onPress: () => {
								postMessage({
									type: "quillToggleHeader",
									data: 6
								})
							}
						},
						{
							id: "header-normal",
							title: "normal",
							onPress: () => {
								postMessage({
									type: "quillRemoveHeader"
								})
							}
						}
					]
				}

				case "link": {
					if (!formats.link) {
						return []
					}

					return [
						{
							id: "open",
							title: "tbd_open",
							onPress: () => {
								if (type !== "link" || !formats.link) {
									return
								}

								Linking.openURL(formats.link).catch(console.error)
							}
						},
						{
							id: "edit",
							title: "tbd_edit",
							onPress: () => {
								if (type !== "link" || !formats.link) {
									return
								}

								prompts
									.input({
										title: "tbd",
										message: "tbd",
										placeholder: "tbd",
										defaultValue: formats.link,
										okText: "tbd",
										cancelText: "tbd"
									})
									.then(response => {
										if (response.cancelled || !response.value.trim()) {
											return
										}

										postMessage({
											type: "quillAddLink",
											data: response.value.trim().toLowerCase()
										})
									})
							}
						},
						{
							id: "remove",
							title: "tbd_remove",
							onPress: () => {
								if (type !== "link" || !formats.link) {
									return
								}

								postMessage({
									type: "quillRemoveLink"
								})
							}
						}
					]
				}

				case "list": {
					return [
						{
							id: "ordered",
							title: "tbd_ordered",
							onPress: () => {
								postMessage({
									type: "quillToggleList",
									data: "ordered"
								})
							}
						},
						{
							id: "bullet",
							title: "tbd_bullet",
							onPress: () => {
								postMessage({
									type: "quillToggleList",
									data: "bullet"
								})
							}
						},
						{
							id: "checklist",
							title: "tbd_checklist",
							onPress: () => {
								postMessage({
									type: "quillToggleList",
									data: "checklist"
								})
							}
						},
						...(formats.list
							? [
									{
										id: "remove",
										title: "tbd_remove",
										onPress: () => {
											postMessage({
												type: "quillRemoveList"
											})
										}
									}
								]
							: [])
					]
				}

				default: {
					return []
				}
			}
		}, [type, keyboardState.isVisible, formats.link, postMessage, formats.list])

		const onPress = useCallback(() => {
			switch (type) {
				case "bold": {
					postMessage({
						type: "quillToggleBold"
					})

					break
				}

				case "italic": {
					postMessage({
						type: "quillToggleItalic"
					})

					break
				}

				case "underline": {
					postMessage({
						type: "quillToggleUnderline"
					})

					break
				}

				case "keyboard": {
					postMessage({
						type: "dismissKeyboard"
					})

					break
				}

				case "link": {
					if (formats.link) {
						break
					}

					prompts
						.input({
							title: "tbd",
							message: "tbd",
							placeholder: "tbd",
							okText: "tbd",
							cancelText: "tbd"
						})
						.then(response => {
							if (response.cancelled || !response.value.trim()) {
								return
							}

							postMessage({
								type: "quillAddLink",
								data: response.value.trim().toLowerCase()
							})
						})

					break
				}

				case "code-block": {
					postMessage({
						type: "quillToggleCodeBlock"
					})

					break
				}

				case "blockquote": {
					postMessage({
						type: "quillToggleBlockquote"
					})

					break
				}
			}
		}, [type, postMessage, formats])

		return (
			<Menu
				type="dropdown"
				disabled={menuButtons.length === 0}
				buttons={menuButtons}
			>
				<PressableScale
					rippleColor="transparent"
					className="flex-row items-center justify-center shrink-0 size-9"
					hitSlop={15}
					enabled={menuButtons.length === 0}
					onPress={onPress}
				>
					{type === "keyboard" ? (
						<FontAwesome6
							name="check"
							size={ICON_SIZE}
							color={textPrimary.color}
						/>
					) : type === "header" ? (
						<Fragment>
							<FontAwesome6
								name="heading"
								size={ICON_SIZE}
								color={formats[type] ? (textPrimary.color as string) : (textForeground.color as string)}
							/>
							{formats[type] && (
								<BlurView
									intensity={100}
									experimentalBlurMethod="dimezisBlurView"
									tint={theme === "dark" ? "dark" : "light"}
									className="flex-row items-center justify-center absolute rounded-full size-4 -mt-5 -mr-5 overflow-hidden border border-border"
								>
									<Text className="text-foreground text-xs">{formats[type]}</Text>
								</BlurView>
							)}
						</Fragment>
					) : type === "list" ? (
						<FontAwesome6
							name={
								formats[type] === "ordered"
									? "list-ol"
									: formats[type] === "bullet"
										? "list-ul"
										: formats[type] === "checked" || formats[type] === "unchecked"
											? "list-check"
											: "list"
							}
							size={ICON_SIZE}
							color={formats[type] ? (textPrimary.color as string) : (textForeground.color as string)}
						/>
					) : (
						<FontAwesome6
							name={
								type === "bold"
									? "bold"
									: type === "italic"
										? "italic"
										: type === "underline"
											? "underline"
											: type === "link"
												? "link"
												: type === "code-block"
													? "code"
													: type === "blockquote"
														? "quote-right"
														: "question"
							}
							size={ICON_SIZE}
							color={formats[type] ? (textPrimary.color as string) : (textForeground.color as string)}
						/>
					)}
				</PressableScale>
			</Menu>
		)
	}
)

export const Toolbar = memo(({ postMessage }: { postMessage: (message: TextEditorEvents) => void }) => {
	const insets = useSafeAreaInsets()
	const { theme } = useUniwind()
	const viewRef = useRef<RNView>(null)
	const { layout, onLayout } = useViewLayout(viewRef)
	const keyboardState = useKeyboardState()
	const textEditorReady = useTextEditorStore(useShallow(state => state.ready))

	useEffect(() => {
		useRichtextStore.getState().setToolbarHeight(layout.height)
	}, [layout.height])

	if (!textEditorReady) {
		return null
	}

	return (
		<KeyboardStickyView
			offset={{
				opened: 0,
				closed: -(insets.bottom + 8)
			}}
		>
			<AnimatedView
				entering={FadeIn}
				exiting={FadeOut}
			>
				<View
					ref={viewRef}
					onLayout={onLayout}
					className="px-4 py-2 bg-transparent flex-row items-center justify-between gap-4"
				>
					<BlurView
						className="rounded-full overflow-hidden border border-border shrink-0"
						intensity={100}
						experimentalBlurMethod="dimezisBlurView"
						tint={theme === "dark" ? "dark" : "light"}
					>
						<View className="flex-row items-center bg-transparent shrink-0 px-1">
							<Button
								type="header"
								postMessage={postMessage}
							/>
							<Button
								type="bold"
								postMessage={postMessage}
							/>
							<Button
								type="italic"
								postMessage={postMessage}
							/>
							<Button
								type="underline"
								postMessage={postMessage}
							/>
							<Button
								type="code-block"
								postMessage={postMessage}
							/>
							<Button
								type="link"
								postMessage={postMessage}
							/>
							<Button
								type="blockquote"
								postMessage={postMessage}
							/>
							<Button
								type="list"
								postMessage={postMessage}
							/>
						</View>
					</BlurView>
					{keyboardState.isVisible && (
						<AnimatedView
							entering={FadeIn}
							exiting={FadeOut}
						>
							<BlurView
								className="rounded-full overflow-hidden border border-border shrink-0"
								intensity={100}
								experimentalBlurMethod="dimezisBlurView"
								tint={theme === "dark" ? "dark" : "light"}
							>
								<Button
									type="keyboard"
									postMessage={postMessage}
								/>
							</BlurView>
						</AnimatedView>
					)}
				</View>
			</AnimatedView>
		</KeyboardStickyView>
	)
})

export default Toolbar
