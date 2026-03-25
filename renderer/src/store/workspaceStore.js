import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const COLORS = ['#8b5cf6', '#4a9eff', '#00d084', '#ff4757', '#ffd700', '#00d4ff', '#ff69b4', '#ff7a00']

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspaces: [],
      activeId: null,

      createWorkspace(name, color) {
        const { workspaces } = get()
        const nextColor = color ?? COLORS[workspaces.length % COLORS.length]
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
        const workspace = {
          id,
          name: name.trim() || 'Workspace',
          createdAt: Date.now(),
          color: nextColor,
          notes: '',
          targetCount: 0,
        }
        set(s => ({ workspaces: [...s.workspaces, workspace], activeId: id }))
        return id
      },

      deleteWorkspace(id) {
        set(s => {
          const remaining = s.workspaces.filter(w => w.id !== id)
          let nextActive = s.activeId
          if (s.activeId === id) {
            nextActive = remaining.length > 0 ? remaining[0].id : null
          }
          return { workspaces: remaining, activeId: nextActive }
        })
      },

      renameWorkspace(id, name) {
        set(s => ({
          workspaces: s.workspaces.map(w =>
            w.id === id ? { ...w, name: name.trim() || w.name } : w
          ),
        }))
      },

      setActive(id) {
        set({ activeId: id })
      },

      updateNotes(id, notes) {
        set(s => ({
          workspaces: s.workspaces.map(w =>
            w.id === id ? { ...w, notes } : w
          ),
        }))
      },

      getActive() {
        const { workspaces, activeId } = get()
        if (!activeId) return { id: null, name: 'Default', color: '#8b5cf6' }
        return workspaces.find(w => w.id === activeId) ?? { id: null, name: 'Default', color: '#8b5cf6' }
      },
    }),
    { name: 'nexus-workspaces' }
  )
)

export { COLORS as WORKSPACE_COLORS }
