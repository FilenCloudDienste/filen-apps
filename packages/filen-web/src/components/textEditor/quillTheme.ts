export class QuillThemeCustomizer {
	private styleId: string = "quill-custom-styles"

	public apply(containerId?: string): void {
		this.removeExistingStyles()

		const css = this.generateCSS(containerId)
		const style = document.createElement("style")

		style.id = this.styleId
		style.textContent = css

		document.head.appendChild(style)
	}

	public removeExistingStyles(): void {
		const existingStyle = document.getElementById(this.styleId)

		if (existingStyle && existingStyle.parentNode) {
			existingStyle.parentNode.removeChild(existingStyle)
		}
	}

	private generateCSS(containerId?: string): string {
		const selector = containerId ? `#${containerId} ` : ""

		return `
			/* Toolbar styling */
			${selector} .ql-toolbar {
				border: 1px solid transparent !important;
				border-bottom: 1px solid var(--border) !important;
				background-color: var(--background) !important;
				border-radius: none !important;
				top: 0 !important;
				position: sticky !important;
				z-index: 100 !important;
				width: 100% !important;
				flex: 0 0 auto !important;
			}

			/* Container styling */
			${selector} .ql-container {
				border: none !important;
				background-color: transparent !important;
				width: 100% !important;
				flex: 1 1 auto !important;
				font-size: 16px !important;
				font-family: var(--font-sans) !important;
			}
			
			/* Default toolbar colors */
			${selector} .ql-toolbar button,
			${selector} .ql-toolbar .ql-picker-label {
				color: var(--primary) !important;
			}
			
			/* Default toolbar colors */
			${selector} .ql-toolbar button,
			${selector} .ql-toolbar .ql-picker-label {
				color: var(--primary) !important;
			}
			
			${selector} .ql-toolbar .ql-stroke {
				stroke: var(--muted-foreground) !important;
			}
			
			${selector} .ql-toolbar .ql-fill,
			${selector} .ql-toolbar .ql-stroke.ql-fill {
				fill: var(--muted-foreground) !important;
			}
			
			/* Active states */
			${selector} .ql-toolbar button.ql-active,
			${selector} .ql-toolbar .ql-picker-label.ql-active,
			${selector} .ql-toolbar .ql-picker-item.ql-selected {
				color: var(--color-blue-500) !important;
			}
			
			${selector} .ql-toolbar button.ql-active .ql-stroke,
			${selector} .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
			${selector} .ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
			${selector} .ql-toolbar button.ql-active .ql-stroke-miter,
			${selector} .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
			${selector} .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter {
				stroke: var(--color-blue-500) !important;
			}
			
			${selector} .ql-toolbar button.ql-active .ql-fill,
			${selector} .ql-toolbar .ql-picker-label.ql-active .ql-fill,
			${selector} .ql-toolbar .ql-picker-item.ql-selected .ql-fill,
			${selector} .ql-toolbar button.ql-active .ql-stroke.ql-fill,
			${selector} .ql-toolbar .ql-picker-label.ql-active .ql-stroke.ql-fill,
			${selector} .ql-toolbar .ql-picker-item.ql-selected .ql-stroke.ql-fill {
				fill: var(--color-blue-500) !important;
			}
			
			/* Hover states */
			${selector} .ql-toolbar button:hover,
			${selector} .ql-toolbar button:focus,
			${selector} .ql-toolbar .ql-picker-label:hover,
			${selector} .ql-toolbar .ql-picker-item:hover {
				color: var(--color-blue-500) !important;
			}
			
			${selector} .ql-toolbar button:hover .ql-stroke,
			${selector} .ql-toolbar button:focus .ql-stroke,
			${selector} .ql-toolbar .ql-picker-label:hover .ql-stroke,
			${selector} .ql-toolbar .ql-picker-item:hover .ql-stroke,
			${selector} .ql-toolbar button:hover .ql-stroke-miter,
			${selector} .ql-toolbar button:focus .ql-stroke-miter,
			${selector} .ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
			${selector} .ql-toolbar .ql-picker-item:hover .ql-stroke-miter {
				stroke: var(--color-blue-500) !important;
			}
			
			${selector} .ql-toolbar button:hover .ql-fill,
			${selector} .ql-toolbar button:focus .ql-fill,
			${selector} .ql-toolbar .ql-picker-label:hover .ql-fill,
			${selector} .ql-toolbar .ql-picker-item:hover .ql-fill,
			${selector} .ql-toolbar button:hover .ql-stroke.ql-fill,
			${selector} .ql-toolbar button:focus .ql-stroke.ql-fill,
			${selector} .ql-toolbar .ql-picker-label:hover .ql-stroke.ql-fill,
			${selector} .ql-toolbar .ql-picker-item:hover .ql-stroke.ql-fill {
				fill: var(--color-blue-500) !important;
			}
			
			/* Editor content styling */
			${selector} .ql-editor {
				padding: 16px !important;
				color: var(--primary) !important;
				background-color: transparent !important;
			}
			
			/* Placeholder styling */
			${selector} .ql-editor.ql-blank::before {
				color: var(--muted-foreground) !important;
			}

			/* Checkboxes styling */
			${selector} .ql-editor li[data-list=unchecked] > .ql-ui:before {
				content: '\\2713';
				color: transparent;
				display: inline-block;
				width: 16px;
				height: 16px;
				border: 1px solid var(--primary);
				border-radius: 50%;
				margin-right: 4px;
				text-align: center;
				line-height: 16px;
				background-color: transparent;
				font-size: 16px !important;
				font-family: var(--font-mono) !important;
			}

			${selector} .ql-editor li[data-list=checked] > .ql-ui:before {
				content: '\\2714';
				color: white !important;
				display: inline-block;
				width: 16px;
				height: 16px;
				border: 1px solid var(--color-blue-500);
				border-radius: 50%;
				margin-right: 4px;
				text-align: center;
				line-height: 16px;
				background-color: var(--color-blue-500);
				font-size: 16px !important;
				font-family: var(--font-mono) !important;
			}

			${selector} .ql-editor li[data-list=checked] {
				text-decoration: line-through !important;
			}

			${selector} .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {
				border-color: var(--border) !important;
				border: none !important;
			}

			${selector} .ql-toolbar.ql-snow .ql-picker-options {
				border: 1px solid var(--border) !important;
				border-color: var(--border) !important;
				border-radius: var(--radius-lg) !important;
				background-color: var(--sidebar) !important;
			}

			${selector} .ql-snow .ql-editor blockquote {
				border-left: 4px solid var(--border) !important;
			}

			${selector} .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
				border-color: transparent !important;
			}

			${selector} .ql-snow .ql-picker.ql-expanded .ql-picker-label {
				color: var(--primary) !important;
			}

			${selector} .ql-snow .ql-picker-options .ql-picker-item {
				color: var(--primary) !important;
			}

			${selector} .ql-snow .ql-picker-options .ql-picker-item:hover {
				color: var(--color-blue-500) !important;
			}

			${selector} .ql-snow .ql-editor .ql-code-block-container {
				background-color: var(--sidebar) !important;
				color: var(--sidebar-foreground) !important;
				border-radius: var(--radius-lg) !important;
				font-family: var(--font-mono) !important;
			}

			${selector} .ql-snow .ql-tooltip {
				background-color: var(--sidebar) !important;
				color: var(--sidebar-foreground) !important;
				border: none !important;
				border-radius: var(--radius-lg) !important;
				box-shadow: none !important;
			}

			${selector} .ql-snow .ql-tooltip input[type=text] {
				background-color: var(--sidebar) !important;
				color: var(--sidebar-foreground) !important;
			}

			${selector} [data-mode=link] {
				left: 16px !important;
			}

			${selector} .ql-snow .ql-tooltip[data-mode=link]::before {
				content: "tbd:";
			}

			${selector} .ql-snow .ql-tooltip.ql-editing a.ql-action::after {
				border-right: 0;
				content: 'tbd';
				padding-right: 0;
			}

			${selector} .ql-snow .ql-tooltip.ql-editing input[type=text] {
				border-radius: var(--radius-lg) !important;
				border: 1px solid var(--border) !important;
				background-color: var(--sidebar) !important;
				color: var(--sidebar-foreground) !important;
			}

			${selector} .ql-editor a {
				color: var(--color-blue-500) !important;
				text-decoration: underline !important;
			}

			${selector} .quill-editor .ql-tooltip {
				left: 16px !important;
			}

			${selector} .quill-editor .ql-tooltip a {
				color: var(--color-blue-500) !important;
			}

			${selector} .ql-snow .ql-tooltip::before {
				content: "tbd:" !important;
			}

			${selector} .ql-snow .ql-tooltip a.ql-action::after {
				border-right: 1px solid var(--muted-foreground);
				content: 'tbd' !important;
			}

			${selector} .ql-snow .ql-tooltip a.ql-remove::before {
				content: 'tbd' !important;
			}

			${selector} .ql-snow a {
				color: var(--color-blue-500) !important;
			}

			${selector} .ql-snow a:hover {
				color: var(--color-blue-500) !important;
				text-decoration: underline !important;
			}
    	`
	}
}
