import { create } from "zustand"

export type AppStore = {
	pathname: string
	setPathname: (fn: string | ((prev: string) => string)) => void
}

export const useAppStore = create<AppStore>(set => ({
	pathname: "/",
	setPathname(fn) {
		set(state => ({
			pathname: typeof fn === "function" ? fn(state.pathname) : fn
		}))
	}
}))

export default useAppStore
