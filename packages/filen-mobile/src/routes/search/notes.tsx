import Text from "@/components/ui/text"
import { memo, Fragment, useMemo, useCallback, useState } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesWithContentQuery from "@/queries/useNotesWithContent.query"
import { notesSorter } from "@/lib/sort"
import View from "@/components/ui/view"
import VirtualList from "@/components/ui/virtualList"
import type { Note } from "@filen/sdk-rs"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { type ListRenderItemInfo, TextInput } from "react-native"
import { Menu } from "@/components/ui/menu"
import { PressableOpacity } from "@/components/ui/pressables"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useResolveClassNames } from "uniwind"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"

export const Notes = memo(() => {
	const [searchQuery, setSearchQuery] = useState<string>("")
	const notesWithContentQuery = useNotesWithContentQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")

	const notes = useMemo(() => {
		const searchQueryNormalized = searchQuery.trim().toLowerCase()

		return notesWithContentQuery.data && searchQueryNormalized.length > 0
			? (
					notesSorter.sort(notesWithContentQuery.data) as (Note & {
						content?: string
					})[]
				).filter(note => {
					if (note.title && note.title.toLowerCase().trim().includes(searchQueryNormalized)) {
						return true
					}

					if (note.preview && note.preview.toLowerCase().trim().includes(searchQueryNormalized)) {
						return true
					}

					if (note.content && note.content.toLowerCase().trim().includes(searchQueryNormalized)) {
						return true
					}

					if (note.tags.some(tag => (tag.name ?? tag.uuid).toLowerCase().trim().includes(searchQueryNormalized))) {
						return true
					}

					return false
				})
			: []
	}, [notesWithContentQuery.data, searchQuery])

	const renderItem = useCallback(
		(info: ListRenderItemInfo<Note>) => {
			return (
				<View className="w-full h-auto border-b border-border flex-row">
					<PressableOpacity
						className="flex-row w-full h-full"
						onPress={() => {
							router.push(Paths.join("/", "note", info.item.uuid))
						}}
					>
						<Menu
							className="flex-row w-full h-full"
							type="context"
							onPress={e => {
								console.log(e.nativeEvent)
							}}
							actions={[
								{
									title: "Title 1"
								},
								{
									title: "Title 2"
								}
							]}
						>
							<View className="flex-1 flex-row gap-4 px-4 bg-transparent py-2">
								<View className="gap-2 bg-transparent">
									<Text>{info.index}</Text>
								</View>
								<View className="gap-2 flex-1 bg-transparent">
									<Text
										numberOfLines={1}
										ellipsizeMode="middle"
									>
										{info.item.title}
									</Text>
									<Text
										numberOfLines={2}
										ellipsizeMode="tail"
										className="text-muted-foreground text-xs"
									>
										{info.item.preview}
									</Text>
									<Text
										numberOfLines={1}
										ellipsizeMode="tail"
										className="text-muted-foreground text-xs"
									>
										{info.item.editedTimestamp}
									</Text>
								</View>
							</View>
						</Menu>
					</PressableOpacity>
				</View>
			)
		},
		[router]
	)

	const keyExtractor = useCallback((note: Note) => {
		return note.uuid
	}, [])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await notesWithContentQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [notesWithContentQuery])

	return (
		<Fragment>
			<Header title="tbd" />
			<SafeAreaView edges={["left", "right"]}>
				<View className="py-2 px-4">
					<View className="flex-row items-center rounded-full px-4 bg-secondary h-12">
						<View className="mr-2 bg-transparent">
							<MaterialIcons
								name="search"
								size={24}
								color={textForeground.color as string}
							/>
						</View>
						<TextInput
							className="flex-1 text-base"
							placeholder="tbd"
							onChangeText={text => setSearchQuery(text)}
							autoFocus={true}
							autoCapitalize="none"
							autoComplete="off"
							autoCorrect={false}
						/>
						{searchQuery.length > 0 && (
							<AnimatedView
								entering={FadeIn}
								exiting={FadeOut}
								className="ml-2 p-1"
							>
								<PressableOpacity
									onPress={() => setSearchQuery("")}
									rippleColor="transparent"
								>
									<MaterialIcons
										name="close"
										size={24}
										color={textForeground.color as string}
									/>
								</PressableOpacity>
							</AnimatedView>
						)}
					</View>
				</View>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					keyExtractor={keyExtractor}
					data={notes}
					renderItem={renderItem}
					onRefresh={onRefresh}
					loading={notesWithContentQuery.status !== "success"}
					emptyComponent={() => {
						if (notesWithContentQuery.status === "success") {
							return (
								<View className="flex-1 items-center justify-center">
									<Text className="text-muted-foreground">tbd</Text>
								</View>
							)
						}

						return null
					}}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

Notes.displayName = "Notes"

export default Notes
