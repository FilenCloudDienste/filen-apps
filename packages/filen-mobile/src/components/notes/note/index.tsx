import Text from "@/components/ui/text"
import View, { LiquidGlassView, isLiquidGlassAvailable } from "@/components/ui/view"
import type { Note as TNote } from "@filen/sdk-rs"
import { type ListRenderItemInfo, ActivityIndicator, Platform } from "react-native"
import { Paths } from "expo-file-system"
import { useRouter } from "expo-router"
import { useResolveClassNames } from "uniwind"
import { useShallow } from "zustand/shallow"
import useNotesStore from "@/stores/useNotes.store"
import { memo, useCallback, useMemo } from "@/lib/memo"
import { useStringifiedClient } from "@/lib/auth"
import { simpleDate } from "@/lib/time"
import Icon from "@/components/notes/note/icon"
import Menu, { NoteMenuOrigin } from "@/components/notes/note/menu"
import { cn } from "@filen/utils"
import { PressableOpacity } from "@/components/ui/pressables"
import { Image } from "@/components/ui/image"

export const Note = memo(({ info, menuOrigin }: { info: ListRenderItemInfo<TNote>; menuOrigin?: NoteMenuOrigin }) => {
	const router = useRouter()
	const textForeground = useResolveClassNames("text-foreground")
	const syncing = useNotesStore(useShallow(state => (state.temporaryContent[info.item.uuid] ?? []).length > 0))
	const isActive = useNotesStore(useShallow(state => state.activeNote?.uuid === info.item.uuid))
	const stringifiedClient = useStringifiedClient()
	const selected = useNotesStore(useShallow(state => state.selectedNotes.some(n => n.uuid === info.item.uuid)))

	const onPress = useCallback(() => {
		if (useNotesStore.getState().selectedNotes.length > 0) {
			useNotesStore.getState().setSelectedNotes(prev => {
				const prevSelected = prev.some(n => n.uuid === info.item.uuid)

				if (prevSelected) {
					return prev.filter(n => n.uuid !== info.item.uuid)
				}

				return [...prev.filter(n => n.uuid !== info.item.uuid), info.item]
			})

			return
		}

		router.push(Paths.join("/", "note", info.item.uuid))
	}, [router, info.item])

	const participantsWithoutCurrentUser = useMemo(() => {
		return info.item.participants.filter(participant => participant.userId !== stringifiedClient?.userId)
	}, [info.item.participants, stringifiedClient])

	return (
		<View className="w-full h-auto border-b border-border flex-col">
			<Menu
				className="flex-row w-full h-auto"
				type="context"
				note={info.item}
				origin={menuOrigin ?? "notes"}
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
						<View className="flex-1 flex-row gap-4 px-4 py-3 w-full h-auto bg-transparent">
							<View className="gap-2 shrink-0 h-auto w-auto bg-transparent">
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
							<View className="gap-2 w-full h-auto bg-transparent flex-col flex-1">
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
								{participantsWithoutCurrentUser.length > 0 && (
									<View className="flex-row flex-wrap gap-2 bg-transparent">
										{participantsWithoutCurrentUser.map(participant => {
											return (
												<Image
													key={participant.userId}
													source={{
														uri: participant.avatar?.startsWith("https://") ? participant.avatar : undefined
													}}
													className="w-6 h-6 rounded-full bg-secondary-foreground"
													cachePolicy="disk"
												/>
											)
										})}
									</View>
								)}
								{info.item.tags.length > 0 && (
									<View className="flex-row flex-wrap gap-2 bg-transparent">
										{info.item.tags.map(tag => (
											<LiquidGlassView
												key={tag.uuid}
												className={cn(
													"px-2 py-1 rounded-full border border-border",
													isLiquidGlassAvailable()
														? ""
														: isActive
															? "bg-background-tertiary"
															: "bg-background-secondary"
												)}
											>
												<Text className="text-xs text-accent-foreground">{tag.name ?? tag.uuid}</Text>
											</LiquidGlassView>
										))}
									</View>
								)}
							</View>
						</View>
					</View>
				</PressableOpacity>
			</Menu>
		</View>
	)
})

export default Note
