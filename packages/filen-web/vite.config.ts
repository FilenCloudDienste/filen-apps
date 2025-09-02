import { defineConfig, normalizePath } from "vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import { resolve, join, dirname } from "node:path"
import { comlink } from "vite-plugin-comlink"
import checker from "vite-plugin-checker"
import { createRequire } from "node:module"
import { viteStaticCopy } from "vite-plugin-static-copy"
import { VitePWA } from "vite-plugin-pwa"
import wasm from "vite-plugin-wasm"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import topLevelAwait from "vite-plugin-top-level-await"

export const now = Date.now()
export const require = createRequire(import.meta.url)
export const pdfjsDistPath = dirname(require.resolve("pdfjs-dist/package.json"))
export const pdfjsCMapsDir = normalizePath(join(pdfjsDistPath, "cmaps"))
export const pdfjsStandardFontsDir = normalizePath(join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts"))

export default defineConfig({
	plugins: [
		{
			name: "configure-response-headers",
			configureServer: server => {
				server.middlewares.use((_, res, next) => {
					res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
					res.setHeader("Cross-Origin-Opener-Policy", "same-origin")

					next()
				})
			}
		},
		viteStaticCopy({
			targets: [
				{
					src: pdfjsCMapsDir,
					dest: "pdfjs/"
				}
			]
		}),
		viteStaticCopy({
			targets: [
				{
					src: pdfjsStandardFontsDir,
					dest: "pdfjs/"
				}
			]
		}),
		nodePolyfills({
			include: ["buffer", "path"],
			globals: {
				Buffer: true
			},
			protocolImports: true
		}),
		wasm(),
		tanstackRouter({
			autoCodeSplitting: true,
			target: "react",
			semicolons: false,
			quoteStyle: "double"
		}),
		viteReact({
			babel: {
				plugins: ["babel-plugin-react-compiler"]
			}
		}),
		tailwindcss(),
		comlink(),
		VitePWA({
			srcDir: "src/lib/sw",
			filename: "sw.ts",
			outDir: "dist",
			strategies: "injectManifest",
			workbox: {
				maximumFileSizeToCacheInBytes: Number.MAX_SAFE_INTEGER
			},
			injectRegister: false,
			manifest: false,
			injectManifest: {
				injectionPoint: undefined,
				rollupFormat: "iife",
				minify: true,
				sourcemap: true,
				buildPlugins: {
					vite: [
						nodePolyfills({
							include: ["buffer", "path"],
							globals: {
								Buffer: true
							},
							protocolImports: true
						}),
						wasm(),
						topLevelAwait({
							promiseExportName: "__tla",
							promiseImportName: i => `__tla_${i}`
						})
					]
				}
			},
			devOptions: {
				enabled: true
			}
		}),
		checker({
			typescript: true
		}),
		topLevelAwait({
			promiseExportName: "__tla",
			promiseImportName: i => `__tla_${i}`
		})
	],
	worker: {
		format: "es",
		plugins: () => [
			nodePolyfills({
				include: ["buffer", "path"],
				globals: {
					Buffer: true
				},
				protocolImports: true
			}),
			wasm(),
			comlink(),
			topLevelAwait({
				promiseExportName: "__tla",
				promiseImportName: i => `__tla_${i}`
			})
		]
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src")
		}
	},
	optimizeDeps: {
		exclude: ["@filen/sdk-rs", "pdfjs-dist"]
	},
	server: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin"
		},
		cors: true
	},
	preview: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin"
		},
		cors: true
	},
	build: {
		sourcemap: true,
		cssMinify: "esbuild",
		minify: "esbuild",
		rollupOptions: {
			output: {
				chunkFileNames() {
					return `[name].[hash].${now}.js`
				},
				entryFileNames() {
					return `[name].${now}.js`
				},
				assetFileNames() {
					return `assets/[name]-[hash].${now}[extname]`
				}
			}
		}
	}
})
