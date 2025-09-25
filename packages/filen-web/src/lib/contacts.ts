import { inputPrompt } from "@/components/prompts/input"
import worker from "@/lib/worker"
import { contactRequestsQueryRefetch } from "@/queries/useContactRequests.query"
import { contactsQueryRefetch } from "@/queries/useContacts.query"
import { confirmPrompt } from "@/components/prompts/confirm"
import { t } from "@/lib/i18n"

export class Contacts {
	public async sendRequest(): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			inputPrompt({
				title: t("prompts.contacts.sendRequest.title"),
				description: t("prompts.contacts.sendRequest.description"),
				inputProps: {
					type: "email",
					placeholder: t("prompts.contacts.sendRequest.placeholder"),
					autoFocus: true,
					required: true,
					pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
					maxLength: 254,
					minLength: 5
				},
				cancelText: t("prompts.contacts.sendRequest.cancel"),
				confirmText: t("prompts.contacts.sendRequest.confirm"),
				async onSubmit(value) {
					try {
						await worker.sdk("sendContactRequest", value)

						await contactRequestsQueryRefetch()

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async cancelRequest(uuid: string): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: t("prompts.contacts.cancelRequest.title"),
				description: t("prompts.contacts.cancelRequest.description"),
				cancelText: t("prompts.contacts.cancelRequest.cancel"),
				confirmText: t("prompts.contacts.cancelRequest.confirm"),
				async onSubmit() {
					try {
						await worker.sdk("cancelContactRequest", uuid)

						await contactRequestsQueryRefetch()

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async acceptRequest(uuid: string): Promise<void> {
		await worker.sdk("acceptContactRequest", uuid)

		await Promise.all([
			contactRequestsQueryRefetch(),
			contactsQueryRefetch({
				type: "normal"
			})
		])
	}

	public async denyRequest(uuid: string): Promise<void> {
		await worker.sdk("denyContactRequest", uuid)

		await contactRequestsQueryRefetch()
	}

	public async delete(uuid: string): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: t("prompts.contacts.deleteContact.title"),
				description: t("prompts.contacts.deleteContact.description"),
				cancelText: t("prompts.contacts.deleteContact.cancel"),
				confirmText: t("prompts.contacts.deleteContact.confirm"),
				async onSubmit() {
					try {
						await worker.sdk("deleteContact", uuid)

						await contactsQueryRefetch({
							type: "normal"
						})

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async unblock(uuid: string): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: t("prompts.contacts.unblockContact.title"),
				description: t("prompts.contacts.unblockContact.description"),
				cancelText: t("prompts.contacts.unblockContact.cancel"),
				confirmText: t("prompts.contacts.unblockContact.confirm"),
				async onSubmit() {
					try {
						await worker.sdk("unblockContact", uuid)

						await Promise.all([
							contactsQueryRefetch({
								type: "blocked"
							}),
							contactsQueryRefetch({
								type: "normal"
							})
						])

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}

	public async block(email: string): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			confirmPrompt({
				title: t("prompts.contacts.blockContact.title"),
				description: t("prompts.contacts.blockContact.description"),
				cancelText: t("prompts.contacts.blockContact.cancel"),
				confirmText: t("prompts.contacts.blockContact.confirm"),
				async onSubmit() {
					try {
						await worker.sdk("blockContact", email)

						await Promise.all([
							contactsQueryRefetch({
								type: "blocked"
							}),
							contactsQueryRefetch({
								type: "normal"
							})
						])

						resolve()
					} catch (e) {
						reject(e)
					}
				}
			})
				.then(response => {
					if (response.cancelled) {
						reject(new Error("Cancelled"))

						return
					}

					reject(new Error("onSubmit not called"))
				})
				.catch(reject)
		})
	}
}

export const contacts = new Contacts()

export default contacts
