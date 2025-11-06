import { type JsClientInterface, fromStringified, type StringifiedClient, login } from "@filen/sdk-rs"
import secureStore, { useSecureStore } from "@/lib/secureStore"

export class Auth {
	private sdkClient: JsClientInterface | null = null
	public readonly stringifiedClientStorageKey: string = "stringifiedClient"

	public async isAuthed(): Promise<
		| {
				isAuthed: false
		  }
		| {
				isAuthed: true
				stringifiedClient: StringifiedClient
		  }
	> {
		const stringifiedClient = await secureStore.get<StringifiedClient>(this.stringifiedClientStorageKey)

		return stringifiedClient !== null
			? {
					isAuthed: true,
					stringifiedClient
				}
			: {
					isAuthed: false
				}
	}

	public async setSdkClient(stringifiedClient: StringifiedClient): Promise<JsClientInterface> {
		this.sdkClient = fromStringified(stringifiedClient)

		return this.sdkClient
	}

	public async getStringifiedClientFromSecureStorage(): Promise<string | null> {
		return await secureStore.get<string>(this.stringifiedClientStorageKey)
	}

	public async getSdkClient(): Promise<JsClientInterface> {
		while (!this.sdkClient) {
			await new Promise<void>(resolve => setTimeout(resolve, 100))
		}

		return this.sdkClient
	}

	public async login(...params: Parameters<typeof login>): Promise<JsClientInterface> {
		this.sdkClient = await login(...params)

		await secureStore.set(this.stringifiedClientStorageKey, await this.sdkClient.toStringified())

		return this.sdkClient
	}

	public async logout(): Promise<void> {
		await secureStore.remove(this.stringifiedClientStorageKey)

		this.sdkClient = null
	}
}

export const auth = new Auth()

export function useIsAuthed(): boolean {
	const [stringifiedClient] = useSecureStore(auth.stringifiedClientStorageKey, null)

	return stringifiedClient !== null
}

export default auth
