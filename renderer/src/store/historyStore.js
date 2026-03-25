import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_ENTRIES = 50

export const useHistoryStore = create(
  persist(
    (set, get) => ({
      entries: [], // [{ id, module, tool, target, timestamp, lines, hitCount }]

      saveEntry(module, tool, target, lines) {
        const hitCount = lines.filter(l => l.type === 'found' || l.type === 'vuln').length
        const entry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          module, tool, target,
          timestamp: Date.now(),
          lines,
          hitCount,
        }
        set(s => ({
          entries: [entry, ...s.entries].slice(0, MAX_ENTRIES)
        }))
        return entry.id
      },

      deleteEntry(id) {
        set(s => ({ entries: s.entries.filter(e => e.id !== id) }))
      },

      clearAll() {
        set({ entries: [] })
      },

      getEntry(id) {
        return get().entries.find(e => e.id === id)
      },

      getLastForTool(tool, target) {
        return get().entries.find(e => e.tool === tool && e.target === target) ?? null
      },
    }),
    { name: 'nexus-scan-history' }
  )
)
