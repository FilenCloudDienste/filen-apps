import { memo, useCallback, useRef, useEffect } from "react"
import { CheckIcon } from "lucide-react"
import { type ChecklistItem as ChecklistItemType } from "./parser"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import events from "@/lib/events"

export const ChecklistItem = memo(
	({
		item,
		onContentChange,
		onCheckedChange,
		addNewLine,
		removeItem,
		initialIds,
		editable,
		onDidType,
		isFirst,
		isLast
	}: {
		item: ChecklistItemType
		onContentChange: ({ item, content }: { item: ChecklistItemType; content: string }) => void
		onCheckedChange: ({ item, checked }: { item: ChecklistItemType; checked: boolean }) => void
		addNewLine: (after: ChecklistItemType) => void
		removeItem: (item: ChecklistItemType) => void
		initialIds: string[]
		editable?: boolean
		onDidType: () => void
		isFirst?: boolean
		isLast?: boolean
	}) => {
		const textAreaRef = useRef<HTMLTextAreaElement>(null)

		const toggleChecked = useCallback(() => {
			if (!item.checked && item.content.trim().length === 0) {
				return
			}

			onCheckedChange({
				item,
				checked: !item.checked
			})

			onDidType()
		}, [onCheckedChange, item, onDidType])

		const onChangeText = useCallback(
			(e: React.ChangeEvent<HTMLTextAreaElement>) => {
				onContentChange({
					item,
					content: e.target.value
				})
			},
			[onContentChange, item]
		)

		const focusItem = useCallback(() => {
			textAreaRef?.current?.focus()
		}, [])

		const focusItemEnd = useCallback(() => {
			textAreaRef?.current?.setSelectionRange(item.content.length, item.content.length)
			textAreaRef?.current?.focus()
		}, [item.content.length])

		const onSubmitEditing = useCallback(() => {
			if (item.content.length > 0) {
				addNewLine(item)
			} else {
				focusItem()
			}
		}, [item, addNewLine, focusItem])

		const onKeyDown = useCallback(
			(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (e.key === "Enter") {
					e.preventDefault()
					e.stopPropagation()

					onSubmitEditing()
				}

				if (e.key === "Backspace" && item.content.length === 0) {
					e.preventDefault()
					e.stopPropagation()

					removeItem(item)
				}

				onDidType()
			},
			[item, removeItem, onDidType, onSubmitEditing]
		)

		useEffect(() => {
			const focusNotesChecklistItemListener = events.subscribe("focusNotesChecklistItem", ({ id }) => {
				if (item.id === id) {
					focusItemEnd()
				}
			})

			return () => {
				focusNotesChecklistItemListener.remove()
			}
		}, [focusItemEnd, item.id])

		return (
			<div className={cn("flex flex-row items-start gap-2.5 shrink-0 w-full px-4 py-1", isFirst && "pt-4", isLast && "pb-4")}>
				{item.checked ? (
					<Button
						variant="default"
						className="flex flex-row items-center justify-center size-5! h-5! w-5! p-0! m-0! bg-blue-500 transition-transform hover:bg-blue-500 gap-0 active:bg-blue-500 rounded-full ring-0! shadow-none! border border-blue-500 disabled:opacity-100 disabled:cursor-default"
						onClick={toggleChecked}
						disabled={editable === false}
					>
						<CheckIcon className="text-white size-3.5" />
					</Button>
				) : (
					<Button
						variant="default"
						className="flex flex-row items-center justify-center size-5! h-5! w-5! p-0! m-0! bg-transparent transition-transform hover:bg-transparent gap-0 active:bg-transparent rounded-full ring-0! shadow-none! border border-gray-500 disabled:opacity-100 disabled:cursor-default"
						onClick={toggleChecked}
						disabled={editable === false}
					/>
				)}
				<Textarea
					ref={textAreaRef}
					id={`checklist-item-${item.id}`}
					name={`checklist-item-${item.id}`}
					className={cn(
						"text-foreground flex-1 shrink-0 border-none bg-transparent ring-0! shadow-none! p-0 m-0 min-h-6 h-auto max-h-auto rounded-none resize-none overflow-hidden field-sizing-content disabled:opacity-100 disabled:cursor-text",
						item.checked && "line-through text-muted-foreground"
					)}
					spellCheck={false}
					autoComplete="off"
					autoCapitalize="off"
					autoCorrect="off"
					value={item.content}
					onChange={onChangeText}
					onClick={focusItem}
					onKeyDown={onKeyDown}
					autoFocus={!initialIds.includes(item.id)}
					disabled={editable === false}
					draggable={false}
				/>
			</div>
		)
	}
)

ChecklistItem.displayName = "ChecklistItem"

export default ChecklistItem
