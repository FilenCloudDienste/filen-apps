import { memo } from "react"

export const DriveListHeader = memo(() => {
	return (
		<div
			className="flex w-full h-auto"
			data-dragselectallowed={true}
		>
			<div
				className="flex w-full flex-row overflow-hidden border-b"
				data-dragselectallowed={true}
			>
				<div
					className="flex flex-row w-full gap-8 justify-between overflow-hidden px-4 py-2"
					data-dragselectallowed={true}
				>
					<div
						className="flex flex-1 flex-row items-center w-[60%] overflow-hidden gap-4"
						data-dragselectallowed={true}
					>
						<p className="text-ellipsis truncate select-none">tbd</p>
					</div>
					<div
						className="flex flex-row items-center w-[40%] justify-between overflow-hidden gap-8"
						data-dragselectallowed={true}
					>
						<div
							className="flex flex-row items-center overflow-hidden w-[25%]"
							data-dragselectallowed={true}
						>
							<p className="text-ellipsis truncate select-none">tbd</p>
						</div>
						<div
							className="flex flex-1 flex-row items-center overflow-hidden"
							data-dragselectallowed={true}
						>
							<p className="text-ellipsis truncate select-none">tbd</p>
						</div>
						<div
							className="flex flex-row items-center overflow-hidden pr-4"
							data-dragselectallowed={true}
						>
							<p className="text-ellipsis truncate select-none">&nbsp;</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
})

DriveListHeader.displayName = "DriveListHeader"

export default DriveListHeader
