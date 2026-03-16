/**
 * Preload script - runs before the web page loads
 * Exposes safe APIs to the renderer process
 */
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
});
