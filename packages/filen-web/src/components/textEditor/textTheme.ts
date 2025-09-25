import { tags as t } from "@lezer/highlight"
import { createTheme } from "@uiw/codemirror-themes"

export function createTextThemes({ backgroundColor, textForegroundColor }: { backgroundColor: string; textForegroundColor: string }) {
	const windowsLightTheme = createTheme({
		theme: "light",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#0078D4", // Windows accent blue
			selection: "#0078D440", // Windows accent blue with alpha
			selectionMatch: "#0078D440",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #E1E1E1", // Windows light border
			gutterBackground: "#FAFAFA", // Windows light surface
			gutterForeground: "#605E5C", // Windows neutral foreground
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#008000", // Classic green comments
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#0078D4" // Windows accent blue
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#A31621" // Windows red/burgundy
			},
			{
				tag: t.number,
				color: "#098658" // Windows green
			},
			{
				tag: t.bool,
				color: "#0078D4" // Windows accent blue
			},
			{
				tag: t.null,
				color: "#0078D4" // Windows accent blue
			},
			{
				tag: t.keyword,
				color: "#0000FF", // Classic blue keywords
				fontWeight: "bold"
			},
			{
				tag: t.operator,
				color: "#323130" // Windows neutral foreground
			},
			{
				tag: t.className,
				color: "#267F99" // Windows teal
			},
			{
				tag: t.definition(t.typeName),
				color: "#267F99" // Windows teal
			},
			{
				tag: t.typeName,
				color: "#267F99" // Windows teal
			},
			{
				tag: t.angleBracket,
				color: "#800000" // Windows dark red
			},
			{
				tag: t.tagName,
				color: "#800000" // Windows dark red
			},
			{
				tag: t.attributeName,
				color: "#FF0000" // Classic red attributes
			}
		]
	})

	const windowsDarkTheme = createTheme({
		theme: "dark",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#60CDFF", // Windows dark mode accent
			selection: "#60CDFF40",
			selectionMatch: "#60CDFF40",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #3B3A39", // Windows dark border
			gutterBackground: "transparent",
			gutterForeground: "#8A8886", // Windows neutral foreground dark
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#6A9955", // VS Code dark green
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#9CDCFE" // VS Code light blue
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#CE9178" // VS Code orange/peach
			},
			{
				tag: t.number,
				color: "#B5CEA8" // VS Code light green
			},
			{
				tag: t.bool,
				color: "#569CD6" // VS Code blue
			},
			{
				tag: t.null,
				color: "#569CD6" // VS Code blue
			},
			{
				tag: t.keyword,
				color: "#C586C0", // VS Code purple
				fontWeight: "bold"
			},
			{
				tag: t.operator,
				color: "#D4D4D4" // VS Code foreground
			},
			{
				tag: t.className,
				color: "#4EC9B0" // VS Code cyan
			},
			{
				tag: t.definition(t.typeName),
				color: "#4EC9B0" // VS Code cyan
			},
			{
				tag: t.typeName,
				color: "#4EC9B0" // VS Code cyan
			},
			{
				tag: t.angleBracket,
				color: "#808080" // VS Code gray
			},
			{
				tag: t.tagName,
				color: "#569CD6" // VS Code blue
			},
			{
				tag: t.attributeName,
				color: "#9CDCFE" // VS Code light blue
			}
		]
	})

	const macOSLightTheme = createTheme({
		theme: "light",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#007AFF", // macOS system blue
			selection: "#007AFF40",
			selectionMatch: "#007AFF40",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #C7C7CC", // macOS system gray 3
			gutterBackground: "#FFFFFF",
			gutterForeground: "#8E8E93", // macOS system gray
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#8E8E93", // macOS system gray
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#007AFF" // macOS system blue
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#34C759" // macOS system green
			},
			{
				tag: t.number,
				color: "#FF9500" // macOS system orange
			},
			{
				tag: t.bool,
				color: "#5856D6" // macOS system purple
			},
			{
				tag: t.null,
				color: "#5856D6" // macOS system purple
			},
			{
				tag: t.keyword,
				color: "#FF2D55", // macOS system pink
				fontWeight: "600"
			},
			{
				tag: t.operator,
				color: "#8E8E93" // macOS system gray
			},
			{
				tag: t.className,
				color: "#5856D6" // macOS system purple
			},
			{
				tag: t.definition(t.typeName),
				color: "#FF3B30" // macOS system red
			},
			{
				tag: t.typeName,
				color: "#5856D6" // macOS system purple
			},
			{
				tag: t.angleBracket,
				color: "#8E8E93" // macOS system gray
			},
			{
				tag: t.tagName,
				color: "#FF9500" // macOS system orange
			},
			{
				tag: t.attributeName,
				color: "#007AFF" // macOS system blue
			}
		]
	})

	const macOSDarkTheme = createTheme({
		theme: "dark",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#0A84FF", // macOS dark mode blue
			selection: "#0A84FF40",
			selectionMatch: "#0A84FF40",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #3A3A3C", // macOS dark mode gray 5
			gutterBackground: "transparent",
			gutterForeground: "#8E8E93", // macOS system gray
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#8E8E93", // macOS system gray
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#0A84FF" // macOS dark mode blue
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#30D158" // macOS dark mode green
			},
			{
				tag: t.number,
				color: "#FF9F0A" // macOS dark mode orange
			},
			{
				tag: t.bool,
				color: "#BF5AF2" // macOS dark mode purple
			},
			{
				tag: t.null,
				color: "#BF5AF2" // macOS dark mode purple
			},
			{
				tag: t.keyword,
				color: "#FF375F", // macOS dark mode pink
				fontWeight: "600"
			},
			{
				tag: t.operator,
				color: "#8E8E93" // macOS system gray
			},
			{
				tag: t.className,
				color: "#BF5AF2" // macOS dark mode purple
			},
			{
				tag: t.definition(t.typeName),
				color: "#FF453A" // macOS dark mode red
			},
			{
				tag: t.typeName,
				color: "#BF5AF2" // macOS dark mode purple
			},
			{
				tag: t.angleBracket,
				color: "#8E8E93" // macOS system gray
			},
			{
				tag: t.tagName,
				color: "#FF9F0A" // macOS dark mode orange
			},
			{
				tag: t.attributeName,
				color: "#0A84FF" // macOS dark mode blue
			}
		]
	})

	const linuxLightTheme = createTheme({
		theme: "light",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#3584E4", // GNOME blue
			selection: "#3584E440",
			selectionMatch: "#3584E440",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #CDC7C2", // GNOME light border
			gutterBackground: "#FAFAFA", // GNOME light background
			gutterForeground: "#77767B", // GNOME dark 4
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#77767B", // GNOME dark 4
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#3584E4" // GNOME blue
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#33D17A" // GNOME green
			},
			{
				tag: t.number,
				color: "#F57C00" // Material orange
			},
			{
				tag: t.bool,
				color: "#9141AC" // GNOME purple
			},
			{
				tag: t.null,
				color: "#9141AC" // GNOME purple
			},
			{
				tag: t.keyword,
				color: "#E01B24", // GNOME red
				fontWeight: "bold"
			},
			{
				tag: t.operator,
				color: "#5E5C64" // GNOME dark 3
			},
			{
				tag: t.className,
				color: "#1C71D8" // GNOME blue (dark)
			},
			{
				tag: t.definition(t.typeName),
				color: "#C01C28" // GNOME red (dark)
			},
			{
				tag: t.typeName,
				color: "#1C71D8" // GNOME blue (dark)
			},
			{
				tag: t.angleBracket,
				color: "#77767B" // GNOME dark 4
			},
			{
				tag: t.tagName,
				color: "#F57C00" // Material orange
			},
			{
				tag: t.attributeName,
				color: "#613583" // GNOME purple (dark)
			}
		]
	})

	const linuxDarkTheme = createTheme({
		theme: "dark",
		settings: {
			background: backgroundColor,
			foreground: textForegroundColor,
			// caret: "#62A0EA", // GNOME blue (light)
			selection: "#62A0EA40",
			selectionMatch: "#62A0EA40",
			lineHighlight: "transparent",
			gutterBorder: "1px solid #3D3846", // GNOME dark 5
			gutterBackground: "transparent",
			gutterForeground: "#9A9996", // GNOME light 4
			fontFamily: "var(--font-sans)"
		},
		styles: [
			{
				tag: t.comment,
				color: "#9A9996", // GNOME light 4
				fontStyle: "italic"
			},
			{
				tag: t.variableName,
				color: "#62A0EA" // GNOME blue (light)
			},
			{
				tag: [t.string, t.special(t.brace)],
				color: "#8FF0A4" // GNOME green (light)
			},
			{
				tag: t.number,
				color: "#FFBE6F" // GNOME orange (light)
			},
			{
				tag: t.bool,
				color: "#DC8ADD" // GNOME purple (light)
			},
			{
				tag: t.null,
				color: "#DC8ADD" // GNOME purple (light)
			},
			{
				tag: t.keyword,
				color: "#F66151", // GNOME red (light)
				fontWeight: "bold"
			},
			{
				tag: t.operator,
				color: "#C0BFBC" // GNOME light 3
			},
			{
				tag: t.className,
				color: "#99C1F1" // GNOME blue (lighter)
			},
			{
				tag: t.definition(t.typeName),
				color: "#F8E45C" // GNOME yellow (light)
			},
			{
				tag: t.typeName,
				color: "#99C1F1" // GNOME blue (lighter)
			},
			{
				tag: t.angleBracket,
				color: "#9A9996" // GNOME light 4
			},
			{
				tag: t.tagName,
				color: "#FFBE6F" // GNOME orange (light)
			},
			{
				tag: t.attributeName,
				color: "#62A0EA" // GNOME blue (light)
			}
		]
	})

	return {
		windows: {
			light: windowsLightTheme,
			dark: windowsDarkTheme
		},
		macOS: {
			light: macOSLightTheme,
			dark: macOSDarkTheme
		},
		linux: {
			light: linuxLightTheme,
			dark: linuxDarkTheme
		}
	}
}
