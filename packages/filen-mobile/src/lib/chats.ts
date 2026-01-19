import auth from "@/lib/auth"
import { type Chat, type ChatMessagePartial, ChatTypingType, type ChatMessage, type Contact } from "@filen/sdk-rs"
import { chatsQueryUpdate } from "@/queries/useChats.query"
import { chatMessagesQueryUpdate } from "@/queries/useChatMessages.query"

export class Chats {
	public async sendMessage({
		chat,
		message,
		inflightId,
		replyTo,
		signal
	}: {
		chat: Chat
		message: string
		inflightId: string
		replyTo?: ChatMessagePartial
		signal?: AbortSignal
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
				...prev.filter(m => m.inner.uuid !== lastMessage.inner.uuid),
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
					inflightId: ""
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

		chatMessagesQueryUpdate({
			params: {
				uuid: message.chat
			},
			updater: prev =>
				prev.map(m =>
					m.inner.uuid === message.inner.uuid
						? {
								...message,
								inflightId: ""
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

		return await sdkClient.leaveChat(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)
	}

	public async delete({ chat, signal }: { chat: Chat; signal?: AbortSignal }) {
		const sdkClient = await auth.getSdkClient()

		return await sdkClient.deleteChat(
			chat,
			signal
				? {
						signal
					}
				: undefined
		)
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

	public async updateLastFocusTimes({ chats, signal }: { chats: Chat[]; signal?: AbortSignal }) {
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
}

export const chats = new Chats()

export default chats
