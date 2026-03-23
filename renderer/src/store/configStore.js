import { create } from 'zustand'

const DEFAULTS = {
  // Wordlist paths
  wordlistSubdomains: '',
  wordlistDirectories: '',
  wordlistPasswords: '',
  wordlistPayloads: '',
  // Scan settings
  httpTimeout: 10,
  scanDelay: 0.5,
  defaultThreads: 20,
  defaultPorts: '1-1000',
  defaultScanType: 'tcp',
  // App settings
  maxActivities: 100,
  maxLogs: 500,
  autoClearOnNewScan: false,
  showLineNumbers: true,
  autoScroll: true,
  // Theme
  accentColor: 'purple-blue',
}

function load() {
  try {
    const stored = localStorage.getItem('nexus-config')
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS
  } catch { return DEFAULTS }
}

export const useConfigStore = create((set, get) => ({
  ...load(),

  set: (key, value) => {
    set({ [key]: value })
    try {
      localStorage.setItem('nexus-config', JSON.stringify({ ...get(), set: undefined, reset: undefined, exportConfig: undefined, importConfig: undefined }))
    } catch {}
  },

  reset: () => {
    set(DEFAULTS)
    localStorage.removeItem('nexus-config')
  },

  exportConfig: () => {
    const state = get()
    const cfg = { ...DEFAULTS }
    Object.keys(DEFAULTS).forEach(k => { cfg[k] = state[k] })
    const data = JSON.stringify(cfg, null, 2)
    const b = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = 'nexus-config.json'
    a.click()
  },

  importConfig: (json) => {
    try {
      const cfg = JSON.parse(json)
      const merged = { ...DEFAULTS, ...cfg }
      set(merged)
      localStorage.setItem('nexus-config', JSON.stringify(merged))
      return true
    } catch { return false }
  },
}))
