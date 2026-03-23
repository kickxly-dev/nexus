import { create } from 'zustand'

export const useSettingsStore = create((set) => ({
  port: null,
  pythonStatus: 'connecting', // 'connecting' | 'online' | 'offline'
  platform: null,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. All tools are temporarily disabled.',
  threatLevel: 'normal', // 'normal' | 'elevated' | 'critical'
  lockoutEnabled: false,
  maxFailedScans: 5,
  failedScanCount: 0,

  setPort: (port) => set({ port }),
  setPythonStatus: (status) => set({ pythonStatus: status }),
  setPlatform: (platform) => set({ platform }),
  setMaintenanceMode: (enabled, message) => set((s) => ({
    maintenanceMode: enabled,
    maintenanceMessage: message || s.maintenanceMessage,
  })),
  setThreatLevel: (level) => set({ threatLevel: level }),
  setLockoutEnabled: (enabled) => set({ lockoutEnabled: enabled }),
  incrementFailedScan: () => set((s) => ({ failedScanCount: s.failedScanCount + 1 })),
  resetFailedScans: () => set({ failedScanCount: 0 }),
}))
