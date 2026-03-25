import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_PER_TOOL = 8

export const useTargetHistoryStore = create(
  persist(
    (set, get) => ({
      history: {},

      addTarget: (toolId, target) => {
        if (!toolId || !target?.trim()) return
        const trimmed = target.trim()
        const prev = get().history[toolId] || []
        // Deduplicate: remove existing occurrence then prepend
        const filtered = prev.filter(t => t !== trimmed)
        const next = [trimmed, ...filtered].slice(0, MAX_PER_TOOL)
        set(s => ({ history: { ...s.history, [toolId]: next } }))
      },

      getHistory: (toolId) => {
        return get().history[toolId] || []
      },

      clearHistory: (toolId) => {
        set(s => {
          const h = { ...s.history }
          delete h[toolId]
          return { history: h }
        })
      },
    }),
    {
      name: 'nexus-target-history',
    }
  )
)
