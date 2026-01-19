import { Fragment } from "react"
import SafeAreaView from "@/components/ui/safeAreaView"
import StackHeader from "@/components/ui/header"
import { useLocalSearchParams, Redirect, useRouter } from "expo-router"
import useNotesQuery from "@/queries/useNotes.query"
import type { Note as TNote, NoteHistory } from "@filen/sdk-rs"
import Content from "@/components/notes/content"
import { Platform } from "react-native"
import useNotesStore from "@/stores/useNotes.store"
import { useShallow } from "zustand/shallow"
import { memo, useMemo, useCallback } from "@/lib/memo"
import { simpleDate } from "@/lib/time"
import { run } from "@filen/utils"
import { useResolveClassNames } from "uniwind"
import prompts from "@/lib/prompts"
import notes from "@/lib/notes"
import alerts from "@/lib/alerts"
import { runWithLoading } from "@/components/ui/fullScreenLoadingModal"
import { Buffer } from "@craftzdog/react-native-buffer"
import { unpack } from "msgpackr"

export const Header = memo(
	({ note, history }: { note: TNote; history?: NoteHistory | null }) => {
		const isInflight = useNotesStore(useShallow(state => (state.inflightContent[note.uuid] ?? []).length > 0))
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
				rightItems={() => {
					if (history) {
						return [
							{
								type: "button",
								props: {
									onPress: restoreFromHistory,
									hitSlop: 32
								},
								icon: {
									name: "refresh",
									size: 24,
									color: textForeground.color
								}
							}
						]
					}

					if (!isInflight) {
						return null
					}

					return [
						{
							type: "loader",
							props: {
								color: textForeground.color,
								size: "small"
							}
						}
					]
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
					history={history ?? undefined}
				/>
			</SafeAreaView>
		</Fragment>
	)
})

export default Note
