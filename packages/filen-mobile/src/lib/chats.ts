import auth from "@/lib/auth"
import { type Chat, type ChatMessagePartial, ChatTypingType, type ChatMessage, type Contact } from "@filen/sdk-rs"
import { chatsQueryUpdate, chatsQueryGet, fetchData as chatsQueryFetch } from "@/queries/useChats.query"
import { chatMessagesQueryUpdate, fetchData as chatMessagesQueryFetch } from "@/queries/useChatMessages.query"
import { Semaphore, run } from "@filen/utils"

export class Chats {
	private readonly refetchChatsAndMessagesMutex: Semaphore = new Semaphore(1)

	public async listBefore({ chat, before, signal }: { chat: Chat; before: bigint; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.listMessagesBefore(
			chat,
			before,
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async sendMessage({
		chat,
		message,
		replyTo,
		signal,
		inflightId
	}: {
		chat: Chat
		message: string
		replyTo?: ChatMessagePartial
		signal?: AbortSignal
		inflightId: string
	}) {
		const sdkClient = await auth.getSdkClient()

		await this.sendTyping({
			chat,
			type: ChatTypingType.Up,
			signal
		})

		chat = await sdkClient.sendChatMessage(
			chat,
			message,
			replyTo,
			signal
				? {
						signal
					}
				: undefined
		)

		const [[updatedChat]] = await Promise.all([
			this.updateLastFocusTimesNow({
				chats: [chat],
				signal
			}),
			this.markRead({
				chat,
				signal
			})
		])

		if (!updatedChat) {
			throw new Error("Failed to update chat after sending message")
		}

		chat = updatedChat

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		const lastMessage = chat.lastMessage

		if (!lastMessage) {
			throw new Error("No last message after sending message")
		}

		chatMessagesQueryUpdate({
			params: {
				uuid: chat.uuid
			},
			updater: prev => [
				...prev.filter(m => m.inner.uuid !== lastMessage.inner.uuid && m.inflightId !== inflightId),
				{
					...lastMessage,
					inflightId
				}
			]
		})

		return {
			chat,
			message: lastMessage
		}
	}

	public async sendTyping({ chat, type, signal }: { chat: Chat; type: ChatTypingType; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.sendTypingSignal(
			chat,
			type,
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async deleteMessage({ chat, message, signal }: { chat: Chat; message: ChatMessage; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.deleteMessage(
			chat,
			message,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		chatMessagesQueryUpdate({
			params: {
				uuid: chat.uuid
			},
			updater: prev => prev.filter(m => m.inner.uuid !== message.inner.uuid)
		})

		return chat
	}

	public async editMessage({
		chat,
		message,
		newMessage,
		signal
	}: {
		chat: Chat
		message: ChatMessage
		newMessage: string
		signal?: AbortSignal
	}) {
		const sdkClient = await auth.getSdkClient()

		message = await sdkClient.editMessage(
			chat,
			message,
			newMessage,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev =>
				prev.map(c =>
					c.uuid === chat.uuid
						? {
								...chat,
								lastMessage: chat.lastMessage?.inner.uuid === message.inner.uuid ? message : chat.lastMessage
							}
						: c
				)
		})

		chatMessagesQueryUpdate({
			params: {
				uuid: chat.uuid
			},
			updater: prev => [
				...prev.filter(m => m.inner.uuid !== message.inner.uuid),
				{
					...message,
					inflightId: "" // Placeholder, actual inflightId is only needed for send sync
				}
			]
		})

		return message
	}

	public async disableMessageEmbed({ message, signal }: { message: ChatMessage; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		message = await sdkClient.disableMessageEmbed(
			message,
			signal
				? {
						signal
					}
				: undefined
		)

		const chat = chatsQueryGet()?.find(c => c.uuid === message.chat)

		if (!chat) {
			throw new Error("Chat not found for message")
		}

		chatMessagesQueryUpdate({
			params: {
				uuid: message.chat
			},
			updater: prev =>
				prev.map(m =>
					m.inner.uuid === message.inner.uuid
						? {
								...message,
								inflightId: "" // Placeholder, actual inflightId is only needed for send sync
							}
						: m
				)
		})

		return message
	}

	public async rename({ chat, newName, signal }: { chat: Chat; newName: string; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.renameChat(
			chat,
			newName,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		return chat
	}

	public async leave({ chat, signal }: { chat: Chat; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		await sdkClient.leaveChat(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)

		// We have to set a timeout here, otherwise the main chat _layout redirect kicks in too early and which feels janky and messes with the navigation stack
		setTimeout(() => {
			chatsQueryUpdate({
				updater: prev => prev.filter(c => c.uuid !== chat.uuid)
			})

			chatMessagesQueryUpdate({
				params: {
					uuid: chat.uuid
				},
				updater: () => []
			})
		}, 3000)
	}

	public async delete({ chat, signal }: { chat: Chat; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chatsQueryUpdate({
			updater: prev => prev.filter(c => c.uuid !== chat.uuid)
		})

		chatMessagesQueryUpdate({
			params: {
				uuid: chat.uuid
			},
			updater: () => []
		})

		await sdkClient.deleteChat(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)

		// We have to set a timeout here, otherwise the main chat _layout redirect kicks in too early and which feels janky and messes with the navigation stack
		setTimeout(() => {
			chatsQueryUpdate({
				updater: prev => prev.filter(c => c.uuid !== chat.uuid)
			})

			chatMessagesQueryUpdate({
				params: {
					uuid: chat.uuid
				},
				updater: () => []
			})
		}, 3000)
	}

	public async mute({ chat, signal, mute }: { chat: Chat; signal?: AbortSignal; mute: boolean }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.muteChat(
			chat,
			mute,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		return chat
	}

	public async create({ contacts, signal }: { contacts: Contact[]; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		const chat = await sdkClient.createChat(
			contacts,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => [...prev.filter(c => c.uuid !== chat.uuid), chat]
		})

		return chat
	}

	public async addParticipant({ chat, contact, signal }: { chat: Chat; contact: Contact; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.addChatParticipant(
			chat,
			contact,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		return chat
	}

	public async removeParticipant({ chat, contact, signal }: { chat: Chat; contact: Contact; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.removeChatParticipant(
			chat,
			contact,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		return chat
	}

	public async markRead({ chat, signal }: { chat: Chat; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.markChatRead(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async updateOnlineStatus({ chat, signal }: { chat: Chat; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chat = await sdkClient.updateChatOnlineStatus(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)

		chatsQueryUpdate({
			updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
		})

		return chat
	}

	public async updateLastFocusTimesNow({ chats, signal }: { chats: Chat[]; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		chats = await sdkClient.updateLastChatFocusTimesNow(
			chats,
			signal
				? {
						signal
					}
				: undefined
		)

		for (const chat of chats) {
			chatsQueryUpdate({
				updater: prev => prev.map(c => (c.uuid === chat.uuid ? chat : c))
			})
		}

		return chats
	}

	public async refetchChatsAndMessages() {
		const result = await run(async defer => {
			await this.refetchChatsAndMessagesMutex.acquire()

			defer(() => {
				this.refetchChatsAndMessagesMutex.release()
			})

			let chats = await chatsQueryFetch()

			chatsQueryUpdate({
				updater: () => chats
			})

			if (!chats || chats.length === 0) {
				return
			}

			await Promise.all(
				chats.map(async chat => {
					const messages = await chatMessagesQueryFetch({
						uuid: chat.uuid
					})

					chatMessagesQueryUpdate({
						params: {
							uuid: chat.uuid
						},
						updater: () => messages
					})
				})
			)

			chats = await chatsQueryFetch()

			chatsQueryUpdate({
				updater: () => chats
			})
		})

		if (!result.success) {
			throw result.error
		}
	}
}

export const chats = new Chats()

export default chats
