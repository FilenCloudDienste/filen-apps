// eslint-disable-next-line no-restricted-imports
import AndroidAlertPromptModule from "./AndroidAlertPromptModule"
import { Platform } from "react-native"

export type InputType = "plain-text" | "password" | "email" | "numeric" | "phone" | "decimal"

export type TextAlignment = "left" | "center" | "right"

export interface StyleOptions {
	// Dialog background
	backgroundColor?: string
	borderRadius?: number
	borderColor?: string
	borderWidth?: number

	// Title styling
	titleColor?: string
	titleSize?: number
	titleAlignment?: TextAlignment
	titleBold?: boolean

	// Message styling
	messageColor?: string
	messageSize?: number
	messageAlignment?: TextAlignment

	// Input styling
	inputBackgroundColor?: string
	inputTextColor?: string
	inputTextSize?: number
	inputBorderRadius?: number
	inputBorderColor?: string
	inputBorderWidth?: number
	inputPadding?: number
	inputPlaceholderColor?: string

	// Button styling
	buttonColor?: string
	buttonSize?: number
	buttonBold?: boolean
	positiveButtonColor?: string
	negativeButtonColor?: string
}

export interface PromptOptions {
	title: string
	message?: string
	defaultValue?: string
	placeholder?: string
	inputType?: InputType
	cancelable?: boolean
	cancelOnBackdrop?: boolean
	positiveText?: string
	negativeText?: string
	style?: StyleOptions
}

export interface PromptResult {
	text: string | null
	cancelled: boolean
}

export async function showPrompt(options: PromptOptions): Promise<PromptResult> {
	if (Platform.OS === "ios") {
		throw new Error("showPrompt is not supported on iOS. Use Alert.prompt instead.")
	}

	return AndroidAlertPromptModule.showPrompt({
		...options,
		cancelable: options.cancelable ?? true,
		cancelOnBackdrop: options.cancelOnBackdrop ?? true
	})
}
