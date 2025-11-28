import Text from "@/components/ui/text"
import View from "@/components/ui/view"
import type { Note as TNote } from "@filen/sdk-rs"
import { type ListRenderItemInfo, ActivityIndicator } from "react-native"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { useShallow } from "zustand/shallow"
import useNotesStore from "@/stores/useNotes.store"
import { memo, useCallback } from "@/lib/memo"
import { simpleDate } from "@/lib/time"
import Icon from "@/components/notes/note/icon"
import Menu, { NoteMenuOrigin } from "@/components/notes/note/menu"
import { cn } from "@filen/utils"

export const Note = memo(({ info, menuOrigin }: { info: ListRenderItemInfo<TNote>; menuOrigin?: NoteMenuOrigin }) => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const syncing = useNotesStore(useShallow(state => (state.temporaryContent[info.item.uuid] ?? []).length > 0))
	const isActive = useNotesStore(useShallow(state => state.active?.uuid === info.item.uuid))

	const onPress = useCallback(() => {
		router.push(Paths.join("/", "note", info.item.uuid))
	}, [router, info.item.uuid])

	return (
		<View className={cn("w-full h-auto border-b border-border flex-row", isActive && "bg-background-secondary")}>
			<Menu
				className="flex-row w-full h-auto"
				type="context"
				note={info.item}
				origin={menuOrigin ?? "notes"}
				isAnchoredToRight={true}
				onPress={onPress}
			>
				<View className="flex-row gap-4 px-4 bg-transparent py-2 w-full h-auto">
					<View className="gap-2 shrink-0 h-auto w-auto">
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
					<View className="gap-2 w-full h-auto">
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
		</View>
	)
})

export default Note
