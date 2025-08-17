import { memo, useLayoutEffect } from "react"
import { IS_DESKTOP } from "@/constants"
import { XIcon, MinusIcon, SquareIcon } from "lucide-react"
import { Button } from "./ui/button"

export const DesktopWrapper = memo(({ children }: { children: React.ReactNode }) => {
	useLayoutEffect(() => {
		if (!IS_DESKTOP) {
			return
		}

		document.body.style.backgroundColor = "transparent"
	}, [])

	if (!IS_DESKTOP) {
		return <div className="flex flex-1 h-[100dvh] w-[100dvw] overflow-hidden">{children}</div>
	}

	return (
		<div className="flex flex-1 h-[100dvh] w-[100dvw] bg-transparent p-[4px] overflow-hidden">
			<div className="flex flex-1 h-full w-full bg-transparent border border-border rounded-[8px] overflow-hidden">
				<div className="absolute flex flex-1 w-full top-0 left-0 right-0 z-40 p-[5px] bg-transparent">
					<div
						className="flex flex-1 w-full bg-transparent rounded-t-[8px] h-[24px] flex-row items-center justify-end"
						style={{
							// @ts-expect-error Not typed for some reason?
							WebkitAppRegion: "drag"
						}}
					>
						<Button
							variant="ghost"
							className="w-[16px] h-full text-muted-foreground hover:text-primary rounded-none pl-2 pr-2"
							onClick={() => console.log("close")}
							style={{
								// @ts-expect-error Not typed for some reason?
								WebkitAppRegion: "no-drag"
							}}
						>
							<MinusIcon
								style={{
									width: "14px",
									height: "14px"
								}}
							/>
						</Button>
						<Button
							variant="ghost"
							className="w-[16px] h-full text-muted-foreground hover:text-primary rounded-none pl-2 pr-2"
							onClick={() => console.log("close")}
							style={{
								// @ts-expect-error Not typed for some reason?
								WebkitAppRegion: "no-drag"
							}}
						>
							<SquareIcon
								style={{
									width: "10px",
									height: "10px"
								}}
							/>
						</Button>
						<Button
							variant="ghost"
							className="w-[16px] h-full text-muted-foreground hover:text-primary hover:bg-red-500! rounded-none pl-2 pr-2 rounded-tr-[8px]"
							onClick={() => console.log("close")}
							style={{
								// @ts-expect-error Not typed for some reason?
								WebkitAppRegion: "no-drag"
							}}
						>
							<XIcon
								style={{
									width: "14px",
									height: "14px"
								}}
							/>
						</Button>
					</div>
				</div>
				<div className="flex flex-1 h-[calc(100dvh-8px)] w-[calc(100dvw-8px)]">{children}</div>
			</div>
		</div>
	)
})

DesktopWrapper.displayName = "DesktopWrapper"

export default DesktopWrapper
