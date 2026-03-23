import { create } from 'zustand'

export const useActivityStore = create((set, get) => ({
  activities: [],

  addActivity: (activity) => set((state) => ({
    activities: [
      { ...activity, id: Date.now(), timestamp: new Date().toISOString() },
      ...state.activities,
    ].slice(0, 100), // keep last 100
  })),

  clearActivities: () => set({ activities: [] }),
}))
