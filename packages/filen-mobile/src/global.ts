import NetInfo from "@react-native-community/netinfo"
import crypto from "crypto"
import { Buffer } from "buffer"

globalThis.crypto = {
	...globalThis.crypto,
	getRandomValues: crypto.getRandomValues
}

globalThis.Buffer = Buffer

NetInfo.configure({
	reachabilityUrl: "https://gateway.filen.io",
	reachabilityTest: async response => response.status === 200,
	reachabilityLongTimeout: 60 * 1000,
	reachabilityShortTimeout: 30 * 1000,
	reachabilityRequestTimeout: 45 * 1000,
	reachabilityShouldRun: () => true,
	shouldFetchWiFiSSID: false,
	useNativeReachability: false
})
