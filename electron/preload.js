const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexus', {
  getPort: () => ipcRenderer.invoke('get-port'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  saveFile: (data, filename) => ipcRenderer.invoke('save-file', { data, filename }),
  openFile: (filters) => ipcRenderer.invoke('open-file', { filters }),

  onPythonReady: (cb) => {
    ipcRenderer.on('python-ready', (_, data) => cb(data));
  },
  onPythonLog: (cb) => {
    ipcRenderer.on('python-log', (_, data) => cb(data));
  },
  onPythonCrash: (cb) => {
    ipcRenderer.on('python-crash', (_, data) => cb(data));
  },

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
});
