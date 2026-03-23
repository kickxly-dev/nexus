const { BrowserWindow } = require('electron');
const { getPythonPort } = require('./pythonBridge');

function registerIpcHandlers(ipcMain, dialog) {
  ipcMain.handle('get-port', () => getPythonPort());

  ipcMain.handle('get-platform', () => process.platform);

  ipcMain.handle('save-file', async (_, { data, filename }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showSaveDialog(win, {
      defaultPath: filename,
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled) return null;
    const fs = require('fs');
    fs.writeFileSync(result.filePath, data, 'utf8');
    return result.filePath;
  });

  ipcMain.handle('open-file', async (_, { filters }) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }],
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('window-minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });
  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) win.unmaximize();
    else win?.maximize();
  });
  ipcMain.handle('window-close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });
}

module.exports = { registerIpcHandlers };
