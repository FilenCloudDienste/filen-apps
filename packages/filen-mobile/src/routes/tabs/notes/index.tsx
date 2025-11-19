import Text from "@/components/ui/text"
import { memo, Fragment, useMemo, useCallback } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import Header from "@/components/ui/header"
import useNotesQuery from "@/queries/useNotes.query"
import { notesSorter } from "@/lib/sort"
import View from "@/components/ui/view"
import VirtualList from "@/components/ui/virtualList"
import type { Note } from "@filen/sdk-rs"
import { run } from "@filen/utils"
import alerts from "@/lib/alerts"
import { type ListRenderItemInfo, ActivityIndicator } from "react-native"
import { Menu } from "@/components/ui/menu"
import { PressableOpacity, AndroidIconButton } from "@/components/ui/pressables"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useResolveClassNames } from "uniwind"
import { useShallow } from "zustand/shallow"
import useNotesStore from "@/stores/useNotes.store"

export const Notes = memo(() => {
	const notesQuery = useNotesQuery()
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const temporaryContent = useNotesStore(useShallow(state => state.temporaryContent))

	const notes = useMemo(() => {
		return notesQuery.data ? notesSorter.sort(notesQuery.data) : []
	}, [notesQuery.data])

	const renderItem = useCallback(
		(info: ListRenderItemInfo<Note>) => {
			const syncing = (temporaryContent[info.item.uuid] ?? []).length > 0

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
							buttons={[
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
									{syncing ? (
										<ActivityIndicator
											size="small"
											color={textForeground.color as string}
										/>
									) : (
										<Text>{info.index}</Text>
									)}
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
		[router, temporaryContent, textForeground]
	)

	const keyExtractor = useCallback((note: Note) => {
		return note.uuid
	}, [])

	const onRefresh = useCallback(async () => {
		const result = await run(async () => {
			await notesQuery.refetch()
		})

		if (!result.success) {
			console.error(result.error)
			alerts.error(result.error)
		}
	}, [notesQuery])

	return (
		<Fragment>
			<Header
				title="tbd"
				right={() => {
					return (
						<AndroidIconButton
							onPress={() => {
								router.push("/search/notes")
							}}
						>
							<MaterialIcons
								name="search"
								size={24}
								color={textForeground.color as string}
							/>
						</AndroidIconButton>
					)
				}}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<VirtualList
					className="flex-1"
					contentInsetAdjustmentBehavior="automatic"
					contentContainerClassName="pb-40"
					keyExtractor={keyExtractor}
					data={notes}
					renderItem={renderItem}
					onRefresh={onRefresh}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

Notes.displayName = "Notes"

export default Notes
