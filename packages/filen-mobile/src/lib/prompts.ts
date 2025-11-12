import { Platform, Alert } from "react-native"
import { showPrompt } from "@/modules/android-alert-prompt"

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
	canellable?: boolean
	okText?: string
	cancelText?: string
	placeholder?: string
}

export async function inputPrompt(options?: InputPromptOptions): Promise<InputPromptResult> {
	return await new Promise<InputPromptResult>((resolve, reject) => {
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
						onPress: (value?: string | { login: string; password: string }) => {
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
					cancelable: options?.canellable ?? true
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
			cancelable: options?.canellable ?? true,
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
			.catch(reject)
	})
}
