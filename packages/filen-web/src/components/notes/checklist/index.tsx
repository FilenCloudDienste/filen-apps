import { memo, useCallback, useState, useEffect, useRef } from "react"
import { parser, type ChecklistItem as ChecklistItemType, type Checklist as ChecklistType } from "./parser"
import ChecklistItem from "./item"
import { Virtuoso } from "react-virtuoso"
import events from "@/lib/events"

export const Checklist = memo(
	({ initialValue, onValueChange, editable }: { initialValue: string; onValueChange: (value: string) => void; editable?: boolean }) => {
		const [parsed, setParsed] = useState<ChecklistType>(parser.parse(initialValue))
		const initialIds = useRef<string[]>(parsed.map(i => i.id)).current
		const [didType, setDidType] = useState<boolean>(false)

		const onContentChange = useCallback(({ item, content }: { item: ChecklistItemType; content: string }) => {
			setParsed(prev =>
				prev.map(i =>
					i.id === item.id
						? {
								...i,
								content
							}
						: i
				)
			)
		}, [])

		const onCheckedChange = useCallback(({ item, checked }: { item: ChecklistItemType; checked: boolean }) => {
			setParsed(prev =>
				prev.map(i =>
					i.id === item.id
						? {
								...i,
								checked
							}
						: i
				)
			)
		}, [])

		const addNewLine = useCallback(
			(after: ChecklistItemType) => {
				const nextIndex = parsed.findIndex(i => i.id === after.id) + 1

				if (nextIndex > 0 && parsed[nextIndex] && parsed[nextIndex].content.trim().length === 0) {
					events.emit("focusNotesChecklistItem", {
						id: parsed[nextIndex].id
					})

					return
				}

				const id = globalThis.crypto.randomUUID()

				setParsed(prev => {
					const newList = [...prev]
					const index = prev.findIndex(i => i.id === after.id)

					newList.splice(index + 1, 0, {
						id,
						checked: false,
						content: ""
					})

					return newList
				})

				events.emit("focusNotesChecklistItem", {
					id
				})

				setTimeout(() => {
					events.emit("focusNotesChecklistItem", {
						id
					})
				})

				setTimeout(() => {
					events.emit("focusNotesChecklistItem", {
						id
					})
				}, 1)
			},
			[parsed]
		)

		const removeItem = useCallback(
			(item: ChecklistItemType) => {
				if (parsed.length === 1) {
					setParsed([
						{
							id: globalThis.crypto.randomUUID(),
							checked: false,
							content: ""
						}
					])

					return
				}

				const index = parsed.findIndex(i => i.id === item.id)

				if (index === -1 || index === 0) {
					return
				}

				const prevItem = parsed[index - 1]

				setParsed(prev => prev.filter(i => i.id !== item.id))

				if (prevItem) {
					events.emit("focusNotesChecklistItem", {
						id: prevItem.id
					})

					setTimeout(() => {
						events.emit("focusNotesChecklistItem", {
							id: prevItem.id
						})
					})

					setTimeout(() => {
						events.emit("focusNotesChecklistItem", {
							id: prevItem.id
						})
					}, 1)
				}
			},
			[parsed]
		)

		const onTyped = useCallback(() => {
			setDidType(true)
		}, [])

		const computeItemKey = useCallback((_: number, item: ChecklistItemType) => item.id, [])

		const itemContent = useCallback(
			(_: number, item: ChecklistItemType) => {
				return (
					<ChecklistItem
						key={item.id}
						item={item}
						onContentChange={onContentChange}
						onCheckedChange={onCheckedChange}
						addNewLine={addNewLine}
						removeItem={removeItem}
						initialIds={initialIds}
						editable={editable}
						onDidType={onTyped}
						isFirst={parsed.at(0)?.id === item.id}
						isLast={parsed.at(-1)?.id === item.id}
					/>
				)
			},
			[onContentChange, onCheckedChange, addNewLine, removeItem, initialIds, editable, onTyped, parsed]
		)

		useEffect(() => {
			if (didType) {
				let stringified = parser.stringify(parsed).trim()

				if (stringified.length === 0) {
					// eslint-disable-next-line quotes
					stringified = '<ul data-checked="false"><li><br></li></ul>'
				}

				onValueChange(stringified)
			}
		}, [parsed, onValueChange, didType])

		return (
			<Virtuoso
				className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden"
				data={parsed}
				computeItemKey={computeItemKey}
				totalCount={parsed.length}
				itemContent={itemContent}
				overscan={window.innerHeight}
				increaseViewportBy={window.innerHeight}
			/>
		)
	}
)

Checklist.displayName = "Checklist"

export default Checklist
