import { app, BrowserWindow } from "electron"
import path from "node:path"
import isDev from "./lib/isDev"

const createWindow = async () => {
	const win = new BrowserWindow({
		width: 1280,
		height: 720,
		frame: false,
		title: "Filen",
		minWidth: 1024,
		minHeight: 576,
		titleBarStyle: "hidden",
		trafficLightPosition: {
			x: 16,
			y: 16
		},
		backgroundColor: "rgba(0, 0, 0, 0)",
		hasShadow: true,
		transparent: true,
		show: false,
		webPreferences: {
			backgroundThrottling: false,
			autoplayPolicy: "no-user-gesture-required",
			contextIsolation: true,
			experimentalFeatures: true,
			preload: isDev ? path.join(__dirname, "..", "dist", "preload.js") : path.join(__dirname, "preload.js"),
			devTools: isDev,
			zoomFactor: 1
		}
	})

	await win.loadURL("http://localhost:5555")

	win.show()
}

app.whenReady().then(() => {
	createWindow()
})
