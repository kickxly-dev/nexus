const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { startPython, stopPython, getPythonPort } = require('./pythonBridge');
const { registerIpcHandlers } = require('./ipcHandlers');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  registerIpcHandlers(ipcMain, dialog);

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
