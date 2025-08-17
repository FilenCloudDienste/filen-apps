import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider, createRouter, createHashHistory, Navigate } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import "@/lib/i18n"
import "@/styles.css"

export const history = createHashHistory()

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	history,
	notFoundMode: "root",
	defaultNotFoundComponent: () => <Navigate to="/404" />,
	defaultErrorComponent: () => <Navigate to="/error" />
})

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

export const rootElement = document.getElementById("app")

if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement)

	root.render(
		<StrictMode>
			<RouterProvider router={router} />
		</StrictMode>
	)
}
