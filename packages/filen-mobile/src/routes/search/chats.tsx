import Chats from "@/components/chats"
import { memo } from "@/lib/memo"

export const SearchChats = memo(() => {
	return <Chats withSearch={true} />
})

export default SearchChats
