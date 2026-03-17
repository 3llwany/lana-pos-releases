/**
 * 🖥️ POS Desktop - Electron Main Process
 * ========================================
 * 1. Starts the .NET backend as a child process
 * 2. Waits for it to be ready
 * 3. Opens a window with the Angular frontend
 * 4. Kills the backend when the app closes
 */

const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

// Helper: log to both main process and renderer DevTools console
function log(msg) {
  console.log(msg);
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log('${msg.replace(/'/g, "\\'")}')`).catch(() => {});
  }
}

// Configuration
const API_PORT = 5029;
const API_URL = `http://localhost:${API_PORT}`;
const MAX_WAIT_MS = 60000; // Max 60 seconds to wait for backend (first run takes longer due to DB migration)

let mainWindow = null;
let backendProcess = null;

// ─────────────────────────────────────────
// Paths (different in dev vs packaged)
// ─────────────────────────────────────────
function getBackendPath() {
  if (app.isPackaged) {
    // In packaged app: resources/backend/pos.Api.exe
    return path.join(process.resourcesPath, "backend", "pos.Api.exe");
  } else {
    // In development: ../pos.Api/bin/Debug/net9.0/pos.Api.exe
    return path.join(
      __dirname,
      "..",
      "pos.Api",
      "bin",
      "Debug",
      "net9.0",
      "pos.Api.exe",
    );
  }
}

function getFrontendPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "frontend");
  } else {
    return path.join(__dirname, "..", "pos-ui", "dist", "pos-ui", "browser");
  }
}

// ─────────────────────────────────────────
// Start the .NET Backend
// ─────────────────────────────────────────
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendExe = getBackendPath();

    if (!fs.existsSync(backendExe)) {
      reject(new Error(`Backend not found at: ${backendExe}`));
      return;
    }

    console.log(`[Electron] Starting backend: ${backendExe}`);

    // Set environment for Electron mode
    const env = {
      ...process.env,
      ASPNETCORE_URLS: API_URL,
      ASPNETCORE_ENVIRONMENT: "Electron",
      DOTNET_ENVIRONMENT: "Electron",
    };

    backendProcess = spawn(backendExe, [], {
      env,
      cwd: path.dirname(backendExe),
      stdio: ["pipe", "pipe", "pipe"],
    });

    backendProcess.stdout.on("data", (data) => {
      console.log(`[API] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on("data", (data) => {
      console.error(`[API ERROR] ${data.toString().trim()}`);
    });

    backendProcess.on("error", (err) => {
      console.error("[Electron] Failed to start backend:", err.message);
      reject(err);
    });

    backendProcess.on("exit", (code) => {
      console.log(`[Electron] Backend exited with code: ${code}`);
      backendProcess = null;
    });

    // Wait for the API to be ready
    waitForBackend(resolve, reject);
  });
}

// ─────────────────────────────────────────
// Wait for Backend to be Ready
// ─────────────────────────────────────────
function waitForBackend(resolve, reject) {
  const startTime = Date.now();

  const check = () => {
    if (Date.now() - startTime > MAX_WAIT_MS) {
      reject(new Error("Backend took too long to start"));
      return;
    }

    // If backend process already died, fail fast
    if (!backendProcess) {
      reject(new Error("Backend process crashed before becoming ready"));
      return;
    }

    const req = http.get(`${API_URL}/api/license/status`, (res) => {
      // ANY response (200, 403, 503, etc.) means the backend IS running
      console.log(
        `[Electron] Backend responded with status: ${res.statusCode}`,
      );
      resolve();
    });

    req.on("error", () => {
      setTimeout(check, 500);
    });

    req.end();
  };

  setTimeout(check, 1000); // Give it a second before first check
}

// ─────────────────────────────────────────
// Stop the Backend
// ─────────────────────────────────────────
function stopBackend() {
  if (backendProcess) {
    console.log("[Electron] Stopping backend...");
    backendProcess.kill("SIGTERM");

    // Force kill after 3 seconds if still running
    setTimeout(() => {
      if (backendProcess) {
        backendProcess.kill("SIGKILL");
      }
    }, 3000);
  }
}

// ─────────────────────────────────────────
// Create the Application Window
// ─────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "POS System",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false, // Show after loaded
  });

  // Load the Angular app from the .NET backend
  mainWindow.loadURL(API_URL);

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
    // Open DevTools for testing
    //mainWindow.webContents.openDevTools();
  });

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ─────────────────────────────────────────
// App Lifecycle
// ─────────────────────────────────────────
app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
    
    // Check for updates (only in packaged app)
    if (app.isPackaged) {
      try {
        log('[AutoUpdater] Starting update check...');
        log(`[AutoUpdater] Current version: ${app.getVersion()}`);
        const result = await autoUpdater.checkForUpdatesAndNotify();
        if (result) {
          log(`[AutoUpdater] Check result: v${result.updateInfo.version}`);
        } else {
          log('[AutoUpdater] Check returned null - no update info');
        }
      } catch (updateErr) {
        log(`[AutoUpdater] ERROR: ${updateErr.message}`);
      }
    } else {
      log('[AutoUpdater] Skipping - app is not packaged (dev mode)');
    }
  } catch (error) {
    dialog.showErrorBox(
      "خطأ في تشغيل البرنامج",
      `تعذر تشغيل السيرفر الداخلي.\n\n${error.message}\n\nالرجاء التواصل مع الدعم الفني.`,
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  app.quit();
});

app.on("before-quit", () => {
  stopBackend();
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─────────────────────────────────────────
// Auto Updater Setup & Events
// ─────────────────────────────────────────
autoUpdater.autoDownload = false; // Disable auto-download to give user control
autoUpdater.autoInstallOnAppQuit = true;

// Handle IPC messages from Renderer
ipcMain.on("check-for-updates", () => {
  autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.on("download-update", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on("install-update", () => {
  autoUpdater.quitAndInstall();
});

autoUpdater.on('checking-for-update', () => {
  log('[AutoUpdater] Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log(`[AutoUpdater] Update available: v${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send("update-available", info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  log(`[AutoUpdater] No update available. Current version is latest (v${info.version}).`);
  if (mainWindow) {
    mainWindow.webContents.send("update-not-available", info);
  }
});

autoUpdater.on('download-progress', (progress) => {
  log(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
  if (mainWindow) {
    mainWindow.webContents.send("download-progress", progress);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log(`[AutoUpdater] Update downloaded: v${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send("update-downloaded", info);
  }
});

autoUpdater.on('error', (err) => {
  log(`[AutoUpdater] ERROR: ${err.message}`);
  if (mainWindow) {
    mainWindow.webContents.send("update-error", err.message);
  }
});
