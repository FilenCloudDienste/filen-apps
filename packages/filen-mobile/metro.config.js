// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

module.exports = withUniwindConfig(config, {
	// relative path to your global.css file (from previous step)
	cssEntryFile: "./src/global.css",
	// (optional) path where we gonna auto-generate typings
	// defaults to project's root
	dtsFile: "./src/uniwind-types.d.ts"
})
