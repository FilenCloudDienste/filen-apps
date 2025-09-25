import { memo, useMemo } from "react"
import { Avatar as UiAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ONLINE_TIMEOUT } from "@/constants"

export const Avatar = memo(
	({
		name,
		src,
		lastActive,
		width,
		height,
		className
	}: {
		name: string
		src?: string
		lastActive?: number
		width?: number
		height?: number
		className?: string
	}) => {
		const isOnline = useMemo(() => {
			return typeof lastActive === "number" && lastActive > Date.now() - ONLINE_TIMEOUT
		}, [lastActive])

		const style = useMemo(() => {
			return {
				width: width ?? 36,
				height: height ?? 36
			}
		}, [width, height])

		return (
			<div className="flex flex-row items-center justify-center relative">
				<UiAvatar
					style={style}
					className={className}
				>
					<AvatarImage
						crossOrigin="anonymous"
						src={src}
						alt={name}
						className="rounded-full"
					/>
					<AvatarFallback className="rounded-full">
						<img
							crossOrigin="anonymous"
							src="/img/fallbackAvatar.webp"
							alt={name}
							className="rounded-full"
						/>
					</AvatarFallback>
				</UiAvatar>
				{typeof lastActive === "number" && (
					<div
						className={cn("absolute size-3 rounded-full bottom-0 right-0 z-[9999]", isOnline ? "bg-green-500" : "bg-gray-500")}
					/>
				)}
			</div>
		)
	}
)

Avatar.displayName = "Avatar"

export default Avatar
