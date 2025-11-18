import { memo, useCallback, useState, useEffect } from "react"
import { KeyboardAwareScrollView } from "@/components/ui/view"
import { checklistParser, type ChecklistItem } from "@filen/utils"
import Item from "@/components/notes/content/checklist/item"
import useChecklistStore from "@/stores/useChecklist.store"
import { useShallow } from "zustand/shallow"

export const Checklist = memo(
	({ initialValue, onChange, readOnly }: { initialValue?: string; onChange?: (value: string) => void; readOnly?: boolean }) => {
		const [didType, setDidType] = useState<boolean>(false)
		const ids = useChecklistStore(useShallow(state => state.ids))

		const onContentChange = useCallback(
			({ item, content }: { item: ChecklistItem; content: string }) => {
				useChecklistStore.getState().setParsed(prev =>
					prev.map(i =>
						i.id === item.id
							? {
									...i,
									content
								}
							: i
					)
				)

				if (didType && onChange) {
					const parsed = useChecklistStore.getState().parsed

					onChange(checklistParser.stringify(parsed))
				}
			},
			[didType, onChange]
		)

		const onCheckedChange = useCallback(
			({ item, checked }: { item: ChecklistItem; checked: boolean }) => {
				useChecklistStore.getState().setParsed(prev =>
					prev.map(i =>
						i.id === item.id
							? {
									...i,
									checked
								}
							: i
					)
				)

				if (didType && onChange) {
					const parsed = useChecklistStore.getState().parsed

					onChange(checklistParser.stringify(parsed))
				}
			},
			[didType, onChange]
		)

		const onTyped = useCallback(() => {
			setDidType(true)
		}, [])

		useEffect(() => {
			const parsed = initialValue ? checklistParser.parse(initialValue) : []

			useChecklistStore.getState().setInputRefs({})
			useChecklistStore.getState().setInitialIds(
				parsed.reduce(
					(acc, item) => {
						acc[item.id] = true

						return acc
					},
					{} as Record<string, boolean>
				)
			)
			useChecklistStore.getState().setParsed(parsed)
			useChecklistStore.getState().setIds(parsed.map(i => i.id))
		}, [initialValue])

		return (
			<KeyboardAwareScrollView
				className="flex-1"
				contentInsetAdjustmentBehavior="automatic"
				contentContainerClassName="p-4 px-6 flex-col pb-10"
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{ids.map(id => {
					return (
						<Item
							key={id}
							id={id}
							onContentChange={onContentChange}
							onCheckedChange={onCheckedChange}
							readOnly={readOnly}
							onDidType={onTyped}
						/>
					)
				})}
			</KeyboardAwareScrollView>
		)
	}
)

Checklist.displayName = "Checklist"

export default Checklist
