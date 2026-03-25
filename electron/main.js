const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { startPython, stopPython, getPythonPort } = require('./pythonBridge');
const { registerIpcHandlers } = require('./ipcHandlers');

const isDev = !app.isPackaged;

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

function setupUpdater() {
  if (isDev) return;
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available',  (i) => mainWindow?.webContents.send('update-status', { status: 'available',   version: i.version }));
    autoUpdater.on('update-not-available', () => mainWindow?.webContents.send('update-status', { status: 'up-to-date' }));
    autoUpdater.on('download-progress', (p) => mainWindow?.webContents.send('update-status', { status: 'downloading', percent: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (i) => mainWindow?.webContents.send('update-status', { status: 'downloaded',  version: i.version }));
    autoUpdater.on('error', (e)            => mainWindow?.webContents.send('update-status', { status: 'error',        message: e.message }));

    ipcMain.handle('update-download', () => autoUpdater.downloadUpdate());
    ipcMain.handle('update-install',  () => autoUpdater.quitAndInstall());
    ipcMain.handle('update-check',    () => autoUpdater.checkForUpdates());

    setTimeout(() => autoUpdater.checkForUpdates(), 5000);
  } catch (e) {
    console.error('Updater failed to load:', e.message);
  }
}

app.whenReady().then(async () => {
  registerIpcHandlers(ipcMain, dialog);
  setupUpdater();

  try {
    await startPython((event, data) => {
      if (mainWindow) mainWindow.webContents.send(event, data);
    });
  } catch (err) {
    console.error('Failed to start Python backend:', err);
  }

  await createWindow();
});

app.on('window-all-closed', () => {
  stopPython();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => stopPython());
