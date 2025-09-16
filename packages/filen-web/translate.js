import "dotenv/config"
import { translateDiff, translate } from "i18n-ai-translate"
import path from "node:path"
import fs from "node:fs/promises"

function deepMergeImmutable(target, source) {
	const result = {
		...target
	}

	for (const key in source) {
		// eslint-disable-next-line no-prototype-builtins
		if (source.hasOwnProperty(key)) {
			if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
				if (result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
					result[key] = deepMergeImmutable(result[key], source[key])
				} else {
					result[key] = deepMergeImmutable({}, source[key])
				}
			} else {
				result[key] = source[key]
			}
		}
	}

	return result
}

function getFlattenedKeys(obj, prefix = "", keys = []) {
	for (const key in obj) {
		// eslint-disable-next-line no-prototype-builtins
		if (obj.hasOwnProperty(key)) {
			const fullKey = prefix ? `${prefix}.${key}` : key

			if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
				getFlattenedKeys(obj[key], fullKey, keys)
			} else {
				keys.push(fullKey)
			}
		}
	}

	return keys
}

const prompts = {
	translate: `You are a professional translator for the Filen (https://filen.io) encrypted cloud storage platform.

Translate each line from \${inputLanguage} to \${outputLanguage}.

Return translations in the same text formatting.

Maintain case sensitivity and whitespacing.

Output only the translations.

Maintain context, make sense of the whole input.

If there are words that could be kept in English, do so where it makes sense. Do not translate brand names, product names etc.

Make sense of the given input keys. Make no mistakes.

Once you are done with the batch, review your translations for any mistakes.

All lines should start and end with an ASCII quotation mark (").

\`\`\`
\${input}
\`\`\``,
	verify: `Given a translation from \${inputLanguage} to \${outputLanguage} in CSV form, reply with NAK if _any_ of the translations are poorly translated.

Otherwise, reply with ACK.

Only reply with ACK/NAK.

\`\`\`
\${inputLanguage},\${outputLanguage}
\${mergedCSV}
\`\`\``,
	style: `Given text from \${inputLanguage} to \${outputLanguage} in CSV form, reply with NAK if _any_ of the translations do not match the formatting of the original.

Check for differing capitalization, punctuation, or whitespaces.

Otherwise, reply with ACK.

Only reply with ACK/NAK.

\`\`\`
\${inputLanguage},\${outputLanguage}
\${mergedCSV}
\`\`\``
}

const langs = [
	// 🌎 Americas
	"es", // Spanish (LatAm + US Hispanics + Spain if fallback)
	"pt", // Portuguese (Europe)
	"fr", // French (Quebec, Caribbean, Europe)

	// 🌍 Europe
	"de", // German
	"it", // Italian
	"nl", // Dutch
	"pl", // Polish
	"sv", // Swedish
	"da", // Danish
	"no", // Norwegian
	"fi", // Finnish
	"hu", // Hungarian
	"cs", // Czech
	"ro", // Romanian
	"he", // Hebrew
	"ru", // Russian
	"uk", // Ukrainian (important addition)

	// 🌏 Asia
	"zh", // Simplified Chinese (Mainland)
	"ja", // Japanese
	"ko", // Korean
	"hi", // Hindi
	"bn", // Bengali
	"ur", // Urdu
	"id", // Indonesian
	"vi", // Vietnamese
	"th" // Thai
]

const currentEn = await fs
	.readFile(path.join(path.resolve(), "src", "locales", "en.json"), {
		encoding: "utf-8"
	})
	.then(data => JSON.parse(data))
	.catch(() => ({}))

const lastEn = await fs
	.readFile(path.join(path.resolve(), "src", "locales", "en.json.last"), {
		encoding: "utf-8"
	})
	.then(data => JSON.parse(data))
	.catch(() => ({}))

const currentEnKeys = getFlattenedKeys(currentEn)

for (const lang of langs) {
	const outPath = path.join(path.resolve(), "src", "locales", `${lang}.json`)

	if (
		!(await fs
			.stat(outPath)
			.then(() => true)
			.catch(() => false))
	) {
		const translated = await translate({
			inputJSON: currentEn,
			inputLanguage: "en",
			outputLanguage: lang,
			engine: "claude",
			model: "claude-opus-4-1-20250805",
			apiKey: globalThis.process.env.ANTHROPIC_API_KEY,
			verbose: true,
			promptMode: "csv",
			skipTranslationVerification: true,
			skipStylingVerification: true,
			rateLimitMs: 3000,
			batchMaxTokens: 200000,
			batchSize: 200000,
			templatedStringSuffix: "}}",
			templatedStringPrefix: "{{",
			overridePrompt: {
				generationPrompt: prompts.translate,
				verificationPrompt: prompts.verify,
				stylePrompt: prompts.style
			},
			chatParams: {
				messages: []
			}
		})

		const resultKeys = getFlattenedKeys(translated)

		if (!translated || Object.keys(translated).length === 0 || resultKeys.length === 0) {
			globalThis.console.warn(`No translations for ${lang}, skipping file write.`)

			continue
		}

		const missingKeys = currentEnKeys.filter(key => !resultKeys.includes(key))

		if (missingKeys.length > 0 || resultKeys.length !== currentEnKeys.length) {
			globalThis.console.error(`Error: Missing keys in ${lang} translation:`, missingKeys)

			globalThis.process.exit(1)
		}

		await fs.writeFile(outPath, JSON.stringify(translated, null, 4) + "\n", {
			encoding: "utf-8"
		})
	} else {
		const currentLang = await fs
			.readFile(outPath, {
				encoding: "utf-8"
			})
			.then(data => JSON.parse(data))
			.catch(() => ({}))

		const translated = await translateDiff({
			inputLanguage: "en",
			outputLanguage: lang,
			engine: "claude",
			model: "claude-opus-4-1-20250805",
			apiKey: globalThis.process.env.ANTHROPIC_API_KEY,
			verbose: true,
			promptMode: "csv",
			skipTranslationVerification: true,
			skipStylingVerification: true,
			rateLimitMs: 3000,
			batchMaxTokens: 200000,
			batchSize: 200000,
			inputJSONBefore: lastEn,
			inputJSONAfter: currentEn,
			templatedStringSuffix: "}}",
			templatedStringPrefix: "{{",
			overridePrompt: {
				generationPrompt: prompts.translate,
				verificationPrompt: prompts.verify,
				stylePrompt: prompts.style
			},
			chatParams: {
				messages: []
			},
			toUpdateJSONs: {
				[lang]: currentLang
			}
		})

		const result = deepMergeImmutable(currentLang, translated[lang])
		const resultKeys = getFlattenedKeys(result)

		if (!result || Object.keys(result).length === 0 || resultKeys.length === 0) {
			globalThis.console.warn(`No translations for ${lang}, skipping file write.`)

			continue
		}

		const missingKeys = currentEnKeys.filter(key => !resultKeys.includes(key))

		if (missingKeys.length > 0 || resultKeys.length !== currentEnKeys.length) {
			globalThis.console.error(`Error: Missing keys in ${lang} translation:`, missingKeys)

			globalThis.process.exit(1)
		}

		await fs.writeFile(outPath, JSON.stringify(result, null, 4) + "\n", {
			encoding: "utf-8"
		})
	}
}

await fs.writeFile(path.join(path.resolve(), "src", "locales", "en.json.last"), JSON.stringify(currentEn, null, 4) + "\n", {
	encoding: "utf-8"
})
