import { Platform, Alert } from "react-native"
import { showPrompt } from "@/modules/android-alert-prompt"

export type AlertPromptResult =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
	  }

export type AlertPromptOptions = {
	title?: string
	message?: string
	cancellable?: boolean
	okText?: string
	cancelText?: string
}

export type InputPromptResult =
	| {
			cancelled: true
	  }
	| {
			cancelled: false
			value: string
	  }

export type InputPromptOptions = {
	title?: string
	message?: string
	inputType?: "plain-text" | "secure-text"
	defaultValue?: string
	cancellable?: boolean
	okText?: string
	cancelText?: string
	placeholder?: string
}

export class Prompts {
	public async alert(options?: AlertPromptOptions): Promise<AlertPromptResult> {
		return await new Promise<AlertPromptResult>(resolve => {
			Alert.alert(
				options?.title ?? "Title",
				options?.message,
				[
					{
						text: options?.cancelText ?? "Cancel",
						style: "cancel",
						onPress: () => {
							resolve({
								cancelled: true
							})
						}
					},
					{
						text: options?.okText ?? "OK",
						onPress: () => {
							resolve({
								cancelled: false
							})
						}
					}
				],
				{
					cancelable: options?.cancellable ?? true,
					onDismiss: () => {
						if (!(options?.cancellable ?? true)) {
							return
						}

						resolve({
							cancelled: true
						})
					}
				}
			)
		})
	}

	public async input(options?: InputPromptOptions): Promise<InputPromptResult> {
		return await new Promise<InputPromptResult>(resolve => {
			if (Platform.OS === "ios") {
				Alert.prompt(
					options?.title ?? "Title",
					options?.message,
					[
						{
							text: options?.cancelText ?? "Cancel",
							style: "cancel",
							onPress: () => {
								resolve({
									cancelled: true
								})
							}
						},
						{
							text: options?.okText ?? "OK",
							onPress: (
								value?:
									| string
									| {
											login: string
											password: string
									  }
							) => {
								if (!value) {
									resolve({
										cancelled: false,
										value: ""
									})

									return
								}

								if (typeof value === "string") {
									resolve({
										cancelled: false,
										value
									})

									return
								}

								resolve({
									cancelled: false,
									value: value.login
								})
							}
						}
					],
					options?.inputType ?? "plain-text",
					undefined,
					options?.defaultValue,
					{
						cancelable: options?.cancellable ?? true,
						onDismiss: () => {
							if (!(options?.cancellable ?? true)) {
								return
							}

							resolve({
								cancelled: true
							})
						}
					}
				)

				return
			}

			showPrompt({
				title: options?.title ?? "Title",
				message: options?.message,
				defaultValue: options?.defaultValue,
				placeholder: options?.placeholder,
				inputType: options?.inputType ? (options.inputType === "secure-text" ? "password" : options.inputType) : "plain-text",
				cancelable: options?.cancellable ?? true,
				positiveText: options?.okText ?? "OK",
				negativeText: options?.cancelText ?? "Cancel"
			})
				.then(result => {
					if (result.cancelled) {
						resolve({
							cancelled: true
						})

						return
					}

					resolve({
						cancelled: false,
						value: result.text ?? ""
					})
				})
				.catch(err => {
					console.error(err)

					resolve({
						cancelled: true
					})
				})
		})
	}
}

export const prompts = new Prompts()

export default prompts
