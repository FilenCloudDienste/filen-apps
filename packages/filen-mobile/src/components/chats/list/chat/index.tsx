import Text from "@/components/ui/text"
import { memo } from "@/lib/memo"
import type { ListRenderItemInfo } from "@/components/ui/virtualList"
import type { Chat as TChat } from "@filen/sdk-rs"
import View from "@/components/ui/view"
import Avatar from "@/components/ui/avatar"
import { PressableScale } from "@/components/ui/pressables"
import Menu from "@/components/chats/list/chat/menu"
import { contactDisplayName } from "@/lib/utils"
import { useRouter } from "expo-router"
import { Paths } from "expo-file-system"

export const Chat = memo(({ info }: { info: ListRenderItemInfo<TChat> }) => {
	const router = useRouter()

	return (
		<View className="flex-row w-full h-auto">
			<Menu
				className="flex-row w-full h-auto"
				isAnchoredToRight={true}
				info={info}
			>
				<PressableScale
					className="flex-row w-full h-auto"
					onPress={() => {
						router.push(Paths.join("/", "chat", info.item.uuid))
					}}
				>
					<View className="flex-row w-full h-auto items-center pl-4 gap-3 bg-transparent">
						<View className="bg-blue-500 size-3 rounded-full shrink-0" />
						<Avatar
							className="shrink-0"
							size={38}
							source={{
								uri: info.item.participants.at(0)?.avatar
							}}
						/>
						<View className="flex-col border-b border-border w-full py-3 items-start gap-0.5 bg-transparent flex-1 pr-4">
							<Text>{info.item.name ?? contactDisplayName(info.item.participants.at(0)!)}</Text>
							{info.item.lastMessage && (
								<Text
									numberOfLines={2}
									ellipsizeMode="tail"
									className="text-muted-foreground text-xs"
								>
									{info.item.lastMessage?.inner.message}
								</Text>
							)}
						</View>
					</View>
				</PressableScale>
			</Menu>
		</View>
	)
})

export default Chat
