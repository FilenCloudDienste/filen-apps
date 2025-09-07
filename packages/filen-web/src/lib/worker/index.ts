import type { FilenSdkRsClientFunctions } from "./worker"
import { extractTransferables } from "./utils"
import { transfer as comlinkTransfer, proxy as comlinkProxy } from "comlink"

export const workerInstance = new ComlinkWorker<typeof import("./worker")>(new URL("./worker", import.meta.url), {
	type: "module"
})

workerInstance.setMessageHandler(comlinkProxy(message => console.log("from worker", message))).catch(console.error)

export async function proxySdk<T extends keyof FilenSdkRsClientFunctions>(
	functionName: T,
	...params: Parameters<FilenSdkRsClientFunctions[T]>
): Promise<Awaited<ReturnType<FilenSdkRsClientFunctions[T]>>> {
	const transferables = extractTransferables(params)

	if (transferables.length > 0) {
		// @ts-expect-error TODO: Fix this type error when there is a better option
		return await workerInstance.callSdkFunction(
			comlinkTransfer(
				{
					functionName,
					params
				},
				transferables
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			) as any
		)
	}

	// @ts-expect-error TODO: Fix this type error when there is a better option
	return await workerInstance.callSdkFunction({
		functionName,
		params
	})
}

export const methods = {
	direct: workerInstance,
	sdk: proxySdk
}

export default methods
