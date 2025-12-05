import Text from "@/components/ui/text"
import View from "@/components/ui/view"
import type { NoteTag, Note } from "@filen/sdk-rs"
import { Platform, ActivityIndicator } from "react-native"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { useShallow } from "zustand/shallow"
import useNotesStore from "@/stores/useNotes.store"
import { memo, useCallback } from "@/lib/memo"
import { simpleDate } from "@/lib/time"
import Menu from "@/components/notes/tag/menu"
import { cn } from "@filen/utils"
import { PressableOpacity } from "@/components/ui/pressables"
import Ionicons from "@expo/vector-icons/Ionicons"

export const Tag = memo(({ info, notesForTag }: { info: ListRenderItemInfo<NoteTag>; notesForTag: Note[] }) => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const textRed500 = useResolveClassNames("text-red-500")
	const isActive = useNotesStore(useShallow(state => state.activeTag?.uuid === info.item.uuid))
	const selected = useNotesStore(useShallow(state => state.selectedTags.some(t => t.uuid === info.item.uuid)))

	const syncing = useNotesStore(
		useShallow(state => {
			return notesForTag.some(n => (state.temporaryContent[n.uuid] ?? []).length > 0)
		})
	)

	const onPress = useCallback(() => {
		if (useNotesStore.getState().selectedTags.length > 0) {
			useNotesStore.getState().setSelectedTags(prev => {
				const prevSelected = prev.some(t => t.uuid === info.item.uuid)

				if (prevSelected) {
					return prev.filter(t => t.uuid !== info.item.uuid)
				}

				return [...prev.filter(t => t.uuid !== info.item.uuid), info.item]
			})

			return
		}

		router.push(Paths.join("/", "tabs", "notes", "noteTag", info.item.uuid))
	}, [router, info.item])

	return (
		<View className="w-full h-auto border-b border-border flex-col">
			<Menu
				className="flex-row w-full h-auto"
				type="context"
				tag={info.item}
				origin="tags"
				isAnchoredToRight={true}
			>
				<PressableOpacity
					onPress={onPress}
					className="w-full h-auto flex-row"
				>
					<View
						className={cn(
							"w-full h-auto flex-row",
							isActive
								? "bg-background-secondary"
								: Platform.select({
										ios: "",
										default: "bg-transparent"
									}),
							selected ? "bg-background-secondary" : ""
						)}
					>
						<View className="flex-1 flex-row gap-4 px-4 py-3 w-full h-auto bg-transparent items-center">
							<View className="gap-2 shrink-0 h-auto w-auto bg-transparent">
								{syncing ? (
									<ActivityIndicator
										size="small"
										color={textForeground.color}
									/>
								) : (
									<Ionicons
										name="pricetag-outline"
										size={24}
										color={textForeground.color}
									/>
								)}
							</View>
							<View className="gap-1 w-full h-auto bg-transparent flex-col flex-1">
								<View className="flex-1 flex-row gap-1.5 items-center w-full h-auto bg-transparent">
									{info.item.favorite && (
										<View className="shrink-0 bg-transparent">
											<Ionicons
												name="heart"
												size={textForeground.fontSize}
												color={textRed500.color}
											/>
										</View>
									)}
									<Text
										numberOfLines={1}
										ellipsizeMode="middle"
										className="flex-1"
									>
										{info.item.name ?? info.item.uuid}
									</Text>
								</View>
								<Text
									numberOfLines={1}
									ellipsizeMode="tail"
									className="text-muted-foreground text-xs"
								>
									{notesForTag.length} tbd_notes, {simpleDate(Number(info.item.editedTimestamp))}
								</Text>
							</View>
						</View>
					</View>
				</PressableOpacity>
			</Menu>
		</View>
	)
})

export default Tag
