import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { useLocalSearchParams, Redirect, useRouter } from "expo-router"
import useNotesQuery from "@/queries/useNotes.query"
import type { Note as TNote, NoteHistory } from "@filen/sdk-rs"
import Content from "@/components/notes/content"
import { ActivityIndicator, Platform } from "react-native"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import { memo, useMemo, useCallback } from "@/lib/memo"
import { simpleDate } from "@/lib/time"
import { cn, run } from "@filen/utils"
import { AnimatedView } from "@/components/ui/animated"
import { FadeIn, FadeOut } from "react-native-reanimated"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useResolveClassNames } from "uniwind"
import { PressableOpacity } from "@/components/ui/pressables"
import prompts from "@/lib/prompts"
import notes from "@/lib/notes"
import alerts from "@/lib/alerts"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import { Buffer } from "@craftzdog/react-native-buffer"
import { unpack } from "msgpackr"

export const Header = memo(
	({ note, history }: { note: TNote; history?: NoteHistory | null }) => {
		const isSyncing = useNotesStore(useShallow(state => (state.temporaryContent[note.uuid] ?? []).length > 0))
		const textForeground = useResolveClassNames("text-foreground")
		const router = useRouter()

		const restoreFromHistory = useCallback(async () => {
			if (!history) {
				return
			}

			const result = await run(async () => {
				return await prompts.alert({
					title: "tbd_restore_note",
					message: "tbd_are_you_sure_restore_note",
					cancelText: "tbd_cancel",
					okText: "tbd_drestore"
				})
			})

			if (!result.success) {
				console.error(result.error)
				alerts.error(result.error)

				return
			}

			if (result.data.cancelled) {
				return
			}

			const restoreResult = await runWithLoading(async () => {
				return await notes.restoreFromHistory({
					note,
					history
				})
			})

			if (!restoreResult.success) {
				console.error(restoreResult.error)
				alerts.error(restoreResult.error)

				return
			}

			if (router.canGoBack()) {
				router.back()
			}
		}, [history, note, router])

		return (
			<StackHeader
				title={history ? simpleDate(Number(history.editedTimestamp)) : (note.title ?? note.uuid)}
				backVisible={true}
				transparent={Platform.OS === "ios"}
				backTitle="tbd_back"
				right={() => {
					if (history) {
						return (
							<AnimatedView
								className={cn(
									"flex-row items-center justify-center",
									Platform.select({
										ios: "px-1.5",
										default: ""
									})
								)}
								entering={FadeIn}
								exiting={FadeOut}
							>
								<PressableOpacity
									onPress={restoreFromHistory}
									hitSlop={32}
								>
									<Ionicons
										name="refresh"
										size={24}
										color={textForeground.color as string}
									/>
								</PressableOpacity>
							</AnimatedView>
						)
					}

					if (!isSyncing) {
						return null
					}

					return (
						<AnimatedView
							className={cn(
								"flex-row items-center justify-center",
								Platform.select({
									ios: "px-1.5",
									default: ""
								})
							)}
							entering={FadeIn}
							exiting={FadeOut}
						>
							<ActivityIndicator
								size="small"
								color={textForeground.color as string}
							/>
						</AnimatedView>
					)
				}}
			/>
		)
	},
	(prevProps, nextProps) => {
		// Only re-render if the note UUID changes
		return prevProps.note.uuid === nextProps.note.uuid
	}
)

export const Note = memo(() => {
	const { uuid, historyItemPacked } = useLocalSearchParams<{
		uuid: string
		historyItemPacked?: string
	}>()

	const notesQuery = useNotesQuery({
		enabled: false
	})

	const note = useMemo(() => {
		return notesQuery.data?.find(n => n.uuid === uuid) as TNote
	}, [notesQuery.data, uuid])

	const history = useMemo(() => {
		return historyItemPacked ? (unpack(Buffer.from(historyItemPacked, "base64")) as NoteHistory) : null
	}, [historyItemPacked])

	if (!(note as TNote | undefined)) {
		return <Redirect href="/tabs/notes" />
	}

	return (
		<Fragment>
			<Header
				note={note}
				history={history}
			/>
			<SafeAreaView edges={["left", "right"]}>
				<Content
					note={note}
					history={history}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

export default Note
