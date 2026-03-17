const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
  // Update methods
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  downloadUpdate: () => ipcRenderer.send("download-update"),
  installUpdate: () => ipcRenderer.send("install-update"),
  // Update listeners
  onUpdateAvailable: (callback) =>
    ipcRenderer.on("update-available", (event, info) => callback(info)),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", (event, info) => callback(info)),
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", (event, progress) => callback(progress)),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", (event, info) => callback(info)),
  onUpdateError: (callback) =>
    ipcRenderer.on("update-error", (event, error) => callback(error)),
});
