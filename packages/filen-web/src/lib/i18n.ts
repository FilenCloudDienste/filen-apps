import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import en from "@/locales/en.json"
import de from "@/locales/de.json"

let initalized: boolean = false
let locales: string[] = ["en"]

try {
	const browserLanguages = globalThis?.navigator?.languages
		?.map(lang => lang.trim().toLowerCase().split("-")[0] ?? "")
		.filter(lang => lang.length > 0)

	locales = browserLanguages.length > 0 ? browserLanguages : ["en"]
} catch (e) {
	console.error(e)
}

i18n.use(initReactI18next)
	.init({
		resources: {
			en: {
				translation: en
			},
			de: {
				translation: de
			}
		},
		ns: ["translation"],
		defaultNS: "translation",
		lng: locales[0] ?? "en",
		debug: true,
		fallbackLng: "en",
		supportedLngs: ["en", "de"],
		interpolation: {
			escapeValue: false
		}
	})
	.then(() => {
		initalized = true
	})
	.catch(console.error)

export function isInitialized(): boolean {
	return initalized
}

export async function waitForInitialization(): Promise<void> {
	while (!initalized) {
		await new Promise(resolve => setTimeout(resolve, 100))
	}
}

export const t = i18n.t

export default i18n
