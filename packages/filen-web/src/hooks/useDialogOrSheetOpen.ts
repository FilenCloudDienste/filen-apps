// hooks/useDialogState.ts
import { useEffect, useState } from "react"

export function useDialogOrSheetOpen(): boolean {
	const [isOpen, setIsOpen] = useState<boolean>(false)

	useEffect(() => {
		const checkDialogs = () => {
			// eslint-disable-next-line quotes
			const dialogs = document.querySelectorAll('[role="dialog"][data-state="open"]')
			// eslint-disable-next-line quotes
			const alertDialogs = document.querySelectorAll('[role="alertdialog"][data-state="open"]')

			setIsOpen(dialogs.length > 0 || alertDialogs.length > 0)
		}

		checkDialogs()

		const observer = new MutationObserver(checkDialogs)

		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["data-state", "role"]
		})

		return () => {
			observer.disconnect()
		}
	}, [])

	return isOpen
}
