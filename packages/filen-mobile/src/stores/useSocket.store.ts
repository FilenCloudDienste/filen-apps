import { create } from "zustand"

export type State = "connected" | "disconnected" | "reconnecting"

export type SocketStore = {
	state: State
	setState: (fn: State | ((prev: State) => State)) => void
}

export const useSocketStore = create<SocketStore>(set => ({
	state: "disconnected",
	setState(fn) {
		set(state => ({
			state: typeof fn === "function" ? fn(state.state) : fn
		}))
	}
}))

export default useSocketStore
