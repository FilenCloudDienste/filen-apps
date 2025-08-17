import { contextBridge, ipcRenderer } from "electron"

export type DesktopApi = {
	ping: () => Promise<"pong">
}

contextBridge.exposeInMainWorld("desktopApi", {
	ping: () => ipcRenderer.invoke("ping")
} satisfies DesktopApi)
