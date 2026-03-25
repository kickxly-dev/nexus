import { create } from 'zustand'

let nextId = 1

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = nextId++
    const toast = { id, type, title, message, duration, createdAt: Date.now() }

    set(s => {
      // max 4 visible — drop oldest if needed
      const existing = s.toasts.length >= 4 ? s.toasts.slice(1) : s.toasts
      return { toasts: [...existing, toast] }
    })

    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration)
    }

    return id
  },

  removeToast: (id) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
  },
}))
