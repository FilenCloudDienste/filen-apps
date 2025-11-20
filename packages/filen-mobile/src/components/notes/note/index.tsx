import Text from "@/components/ui/text"
import View from "@/components/ui/view"
import type { Note as TNote } from "@filen/sdk-rs"
import { type ListRenderItemInfo, ActivityIndicator } from "react-native"
import { PressableOpacity } from "@/components/ui/pressables"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { useShallow } from "zustand/shallow"
import useNotesStore from "@/stores/useNotes.store"
import { memo, useCallback } from "@/lib/memo"
import { simpleDate } from "@/lib/time"
import Icon from "@/components/notes/note/icon"
import Menu from "@/components/notes/note/menu"

export const Note = memo(({ info }: { info: ListRenderItemInfo<TNote> }) => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const syncing = useNotesStore(useShallow(state => (state.temporaryContent[info.item.uuid] ?? []).length > 0))

	const onPress = useCallback(() => {
		router.push(Paths.join("/", "note", info.item.uuid))
	}, [router, info.item.uuid])

	return (
		<View className="w-full h-auto border-b border-border flex-row">
			<PressableOpacity
				className="flex-row w-full h-full"
				onPress={onPress}
			>
				<Menu
					type="context"
					note={info.item}
				>
					<View className="flex-1 flex-row gap-4 px-4 bg-transparent py-2">
						<View className="gap-2 bg-transparent">
							{syncing ? (
								<ActivityIndicator
									size="small"
									color={textForeground.color}
								/>
							) : (
								<Icon
									note={info.item}
									iconSize={24}
								/>
							)}
						</View>
						<View className="gap-2 flex-1 bg-transparent">
							<Text
								numberOfLines={1}
								ellipsizeMode="middle"
							>
								{info.item.title ?? info.item.uuid}
							</Text>
							{info.item.preview && (
								<Text
									numberOfLines={2}
									ellipsizeMode="tail"
									className="text-muted-foreground text-xs"
								>
									{info.item.preview}
								</Text>
							)}
							<Text
								numberOfLines={1}
								ellipsizeMode="tail"
								className="text-muted-foreground text-xs"
							>
								{simpleDate(Number(info.item.editedTimestamp))}
							</Text>
						</View>
					</View>
				</Menu>
			</PressableOpacity>
		</View>
	)
})

export default Note
