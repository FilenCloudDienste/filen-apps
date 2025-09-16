import "dotenv/config"
import { translateDiff } from "i18n-ai-translate"
import path from "node:path"
import fs from "node:fs/promises"

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
	"en", // English (US, Canada)
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

for (const lang of langs) {
	const outPath = path.join(path.resolve(), "src", "locales", `${lang}.json`)

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
		inputJSONBefore: await fs
			.readFile(path.join(path.resolve(), "src", "locales", "en.json.last"), {
				encoding: "utf-8"
			})
			.then(data => JSON.parse(data))
			.catch(() => ({})),
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
			[lang]: await fs
				.readFile(outPath, {
					encoding: "utf-8"
				})
				.then(data => JSON.parse(data))
				.catch(() => ({}))
		}
	})

	if (!translated[lang]["en"]) {
		globalThis.console.warn(`No translations for ${lang}, skipping file write.`)

		continue
	}

	await fs.writeFile(outPath, JSON.stringify(translated[lang]["en"], null, 4) + "\n", {
		encoding: "utf-8"
	})
}

await fs.writeFile(path.join(path.resolve(), "src", "locales", "en.json.last"), JSON.stringify(currentEn, null, 4) + "\n", {
	encoding: "utf-8"
})
