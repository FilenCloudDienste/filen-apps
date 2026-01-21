import Notes from "@/components/notes"
import { memo } from "@/lib/memo"

export const SearchNotes = memo(() => {
	return <Notes withSearch={true} />
})

export default SearchNotes
