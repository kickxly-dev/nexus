import { create } from 'zustand'

export const useLogStore = create((set, get) => ({
  logs: [],
  addLog: (action, detail = {}) => set((state) => ({
    logs: [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        action,
        ...detail,
      },
      ...state.logs,
    ].slice(0, 500),
  })),
  clearLogs: () => set({ logs: [] }),
  exportLogs: () => {
    const data = JSON.stringify(get().logs, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `nexus-audit-${Date.now()}.json`
    a.click()
  },
}))
