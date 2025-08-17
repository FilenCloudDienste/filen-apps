import { useLocalStorage } from "@uidotdev/usehooks"

export type Config =
	| {
			authed: false
	  }
	| {
			authed: true
	  }

export function useConfig() {
	const [config, setConfig] = useLocalStorage<Config>("config", {
		authed: false
	})

	return {
		config,
		setConfig
	}
}

export default useConfig
