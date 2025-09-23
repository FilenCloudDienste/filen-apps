import { memo, useCallback } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import usePreviewStore from "@/stores/preview.store"
import { useShallow } from "zustand/shallow"
import { XIcon, EllipsisVerticalIcon } from "lucide-react"
import { Button } from "../ui/button"
import DriveListItemMenu from "../drive/list/item/menu"
import { IS_DESKTOP } from "@/constants"
import { cn } from "@/lib/utils"
import PreviewList from "./list"

export const Preview = memo(() => {
	const open = usePreviewStore(useShallow(state => state.open))
	const currentItem = usePreviewStore(useShallow(state => state.items.at(state.currentIndex) ?? null))

	const close = useCallback(() => {
		usePreviewStore.getState().hide()
	}, [])

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				close()
			}
		},
		[close]
	)

	return (
		<Sheet
			open={open}
			onOpenChange={onOpenChange}
			modal={true}
		>
			<SheetContent
				side="center"
				className="border border-border rounded-lg p-0 flex-col gap-0 z-50 shadow-sm"
				hideCloseButton={true}
				overlayClassName={cn("bg-sidebar", IS_DESKTOP ? "m-[6px] rounded-lg" : "m-0")}
				style={{
					height: "calc(100dvh - 32px)",
					width: "calc(100dvw - 32px)",
					margin: "16px"
				}}
			>
				<SheetHeader className="flex flex-row items-center w-full px-4 border-b justify-between">
					<div>
						<SheetTitle>{currentItem?.meta?.name ?? "Unknown"}</SheetTitle>
					</div>
					<div className="flex flex-row items-center gap-4">
						{currentItem && (
							<DriveListItemMenu
								item={{
									type: "file",
									data: currentItem
								}}
								type="dropdown"
							>
								<Button
									variant="ghost"
									size="icon"
								>
									<EllipsisVerticalIcon />
								</Button>
							</DriveListItemMenu>
						)}
						<Button
							size="icon"
							variant="ghost"
							onClick={close}
						>
							<XIcon />
						</Button>
					</div>
				</SheetHeader>
				<PreviewList />
			</SheetContent>
		</Sheet>
	)
})

Preview.displayName = "Preview"

export default Preview
