import { useEffect, useState, useMemo, useCallback } from "react"

export type ColorScheme = {
	background: string
	foreground: string
	card: string
	cardForeground: string
	popover: string
	popoverForeground: string
	primary: string
	primaryForeground: string
	secondary: string
	secondaryForeground: string
	muted: string
	mutedForeground: string
	accent: string
	accentForeground: string
	destructive: string
	destructiveForeground: string
	border: string
	input: string
	ring: string
	chart1: string
	chart2: string
	chart3: string
	chart4: string
	chart5: string
	sidebar: string
	sidebarForeground: string
	sidebarPrimary: string
	sidebarPrimaryForeground: string
	sidebarAccent: string
	sidebarAccentForeground: string
	sidebarBorder: string
	sidebarRing: string
	radius: {
		sm: string
		md: string
		lg: string
		xl: string
	}
}

export const colorCache = new Map<string, string>()

export const M1 = [
	[0.8189330101, 0.3618667424, -0.1288597137],
	[0.0329845436, 0.9293118715, 0.0361456387],
	[0.0482003018, 0.2643662691, 0.633851707]
]

export const M2 = [
	[4.0767416621, -3.3077115913, 0.2309699292],
	[-1.2684380046, 2.6097574011, -0.3413193965],
	[-0.0041960863, -0.7034186147, 1.707614701]
]

export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
	const hRad = h * 0.017453292519943295
	const a = c * Math.cos(hRad)
	const b = c * Math.sin(hRad)
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b
	const s_ = l - 0.0894841775 * a - 1.291485548 * b
	const l2 = l_ * l_ * l_
	const m2 = m_ * m_ * m_
	const s2 = s_ * s_ * s_

	if (
		!M2[0] ||
		!M2[0][0] ||
		!M2[0][1] ||
		!M2[0][2] ||
		!M2[1] ||
		!M2[1][0] ||
		!M2[1][1] ||
		!M2[1][2] ||
		!M2[2] ||
		!M2[2][0] ||
		!M2[2][1] ||
		!M2[2][2]
	) {
		return [0, 0, 0]
	}

	let r = M2[0][0] * l2 + M2[0][1] * m2 + M2[0][2] * s2
	let g = M2[1][0] * l2 + M2[1][1] * m2 + M2[1][2] * s2
	let b2 = M2[2][0] * l2 + M2[2][1] * m2 + M2[2][2] * s2

	r = r >= 0.0031308 ? 1.055 * Math.pow(r, 0.4166666666666667) - 0.055 : 12.92 * r
	g = g >= 0.0031308 ? 1.055 * Math.pow(g, 0.4166666666666667) - 0.055 : 12.92 * g
	b2 = b2 >= 0.0031308 ? 1.055 * Math.pow(b2, 0.4166666666666667) - 0.055 : 12.92 * b2

	return [
		Math.round(Math.max(0, Math.min(1, r)) * 255),
		Math.round(Math.max(0, Math.min(1, g)) * 255),
		Math.round(Math.max(0, Math.min(1, b2)) * 255)
	]
}

export const hexChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]

export function rgbToHex(r: number, g: number, b: number): string {
	return (
		"#" +
		hexChars[(r >> 4) & 15] +
		hexChars[r & 15] +
		hexChars[(g >> 4) & 15] +
		hexChars[g & 15] +
		hexChars[(b >> 4) & 15] +
		hexChars[b & 15]
	)
}

export function oklchToHex(oklchString: string): string {
	if (!oklchString) {
		return "#000000"
	}

	const cached = colorCache.get(oklchString)

	if (cached) {
		return cached
	}

	const match = oklchString.match(/oklch\(([^)]+)\)|^([0-9.\s/%-]+)$/)
	const cleanString = match ? match[1] || match[2] : oklchString

	if (!cleanString) {
		return "#000000"
	}

	// eslint-disable-next-line no-useless-escape
	const parts = cleanString.split(/[\s\/]+/)

	if (parts.length < 3) {
		colorCache.set(oklchString, "#000000")

		return "#000000"
	}

	if (!parts[0] || !parts[1] || !parts[2]) {
		return "#000000"
	}

	const l = parseFloat(parts[0])
	const c = parseFloat(parts[1])
	const h = parseFloat(parts[2]) || 0

	if (isNaN(l) || isNaN(c)) {
		colorCache.set(oklchString, "#000000")

		return "#000000"
	}

	const [r, g, b] = oklchToRgb(l, c, h)
	const hex = rgbToHex(r, g, b)

	colorCache.set(oklchString, hex)

	return hex
}

export const COLOR_VARS = [
	"--background",
	"--foreground",
	"--card",
	"--card-foreground",
	"--popover",
	"--popover-foreground",
	"--primary",
	"--primary-foreground",
	"--secondary",
	"--secondary-foreground",
	"--muted",
	"--muted-foreground",
	"--accent",
	"--accent-foreground",
	"--destructive",
	"--destructive-foreground",
	"--border",
	"--input",
	"--ring",
	"--chart-1",
	"--chart-2",
	"--chart-3",
	"--chart-4",
	"--chart-5",
	"--sidebar",
	"--sidebar-foreground",
	"--sidebar-primary",
	"--sidebar-primary-foreground",
	"--sidebar-accent",
	"--sidebar-accent-foreground",
	"--sidebar-border",
	"--sidebar-ring"
] as const

export const RADIUS_VARS = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl"] as const

export function useColorScheme(): ColorScheme {
	const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
	const [colorValues, setColorValues] = useState<string[]>([])
	const [radiusValues, setRadiusValues] = useState<string[]>([])

	const colors = useMemo(() => {
		const [
			background,
			foreground,
			card,
			cardForeground,
			popover,
			popoverForeground,
			primary,
			primaryForeground,
			secondary,
			secondaryForeground,
			muted,
			mutedForeground,
			accent,
			accentForeground,
			destructive,
			destructiveForeground,
			border,
			input,
			ring,
			chart1,
			chart2,
			chart3,
			chart4,
			chart5,
			sidebar,
			sidebarForeground,
			sidebarPrimary,
			sidebarPrimaryForeground,
			sidebarAccent,
			sidebarAccentForeground,
			sidebarBorder,
			sidebarRing
		] = colorValues.map(oklchToHex)

		const [radiusSm, radiusMd, radiusLg, radiusXl] = radiusValues

		return {
			background: background ?? "#000000",
			foreground: foreground ?? "#000000",
			card: card ?? "#000000",
			cardForeground: cardForeground ?? "#000000",
			popover: popover ?? "#000000",
			popoverForeground: popoverForeground ?? "#000000",
			primary: primary ?? "#000000",
			primaryForeground: primaryForeground ?? "#000000",
			secondary: secondary ?? "#000000",
			secondaryForeground: secondaryForeground ?? "#000000",
			muted: muted ?? "#000000",
			mutedForeground: mutedForeground ?? "#000000",
			accent: accent ?? "#000000",
			accentForeground: accentForeground ?? "#000000",
			destructive: destructive ?? "#000000",
			destructiveForeground: destructiveForeground ?? primaryForeground ?? "#000000",
			border: border ?? "#000000",
			input: input ?? "#000000",
			ring: ring ?? "#000000",
			chart1: chart1 ?? "#000000",
			chart2: chart2 ?? "#000000",
			chart3: chart3 ?? "#000000",
			chart4: chart4 ?? "#000000",
			chart5: chart5 ?? "#000000",
			sidebar: sidebar ?? "#000000",
			sidebarForeground: sidebarForeground ?? "#000000",
			sidebarPrimary: sidebarPrimary ?? "#000000",
			sidebarPrimaryForeground: sidebarPrimaryForeground ?? "#000000",
			sidebarAccent: sidebarAccent ?? "#000000",
			sidebarAccentForeground: sidebarAccentForeground ?? "#000000",
			sidebarBorder: sidebarBorder ?? "#000000",
			sidebarRing: sidebarRing ?? "#000000",
			radius: {
				sm: radiusSm ?? "4px",
				md: radiusMd ?? "6px",
				lg: radiusLg ?? "8px",
				xl: radiusXl ?? "12px"
			}
		}
	}, [colorValues, radiusValues])

	const updateColors = useCallback(() => {
		const computedStyle = globalThis.window.getComputedStyle(document.documentElement)
		const newColorValues = COLOR_VARS.map(varName => computedStyle.getPropertyValue(varName).trim())
		const newRadiusValues = RADIUS_VARS.map(varName => computedStyle.getPropertyValue(varName).trim())
		const newIsDark = document.documentElement.classList.contains("dark")

		if (
			JSON.stringify(newColorValues) !== JSON.stringify(colorValues) ||
			JSON.stringify(newRadiusValues) !== JSON.stringify(radiusValues) ||
			newIsDark !== isDark
		) {
			setColorValues(newColorValues)
			setRadiusValues(newRadiusValues)
			setIsDark(newIsDark)
		}
	}, [colorValues, radiusValues, isDark])

	useEffect(() => {
		updateColors()

		let timeoutId: number

		const observer = new MutationObserver(() => {
			clearTimeout(timeoutId)

			timeoutId = window.setTimeout(updateColors, 16)
		})

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"]
		})

		return () => {
			observer.disconnect()

			clearTimeout(timeoutId)
		}
	}, [updateColors])

	return colors
}

export default useColorScheme
