import { create } from 'zustand'

async function hashPassword(password) {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function loadUsers() {
  try {
    const stored = localStorage.getItem('nexus-users')
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function saveUsers(users) {
  localStorage.setItem('nexus-users', JSON.stringify(users))
}

function loadSession() {
  try {
    const s = localStorage.getItem('nexus-session')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

// Default admin hash for 'nexus123'
const DEFAULT_ADMIN_HASH = '4a8a08f09d37b73795649038408b5f33c9f45ab9e5d12b9f8a95e9da6cb9e2a4'

const DEFAULT_USERS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@nexus.local',
    role: 'admin',
    avatar: 'A',
    createdAt: new Date().toISOString(),
    lastSeen: null,
    passwordHash: DEFAULT_ADMIN_HASH,
  }
]

export const useAuthStore = create((set, get) => {
  const initialUsers = loadUsers() || DEFAULT_USERS
  if (!loadUsers()) saveUsers(DEFAULT_USERS)

  return {
    users: initialUsers,
    currentUser: loadSession(),
    authError: null,
    loading: false,

    login: async (username, password) => {
      set({ loading: true, authError: null })
      await new Promise(r => setTimeout(r, 400)) // natural delay

      const users = get().users
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())

      if (!user) {
        set({ authError: 'No account found with that username.', loading: false })
        return false
      }

      const hash = await hashPassword(password)
      if (hash !== user.passwordHash) {
        set({ authError: 'Wrong password. Try again.', loading: false })
        return false
      }

      const updated = users.map(u => u.id === user.id ? { ...u, lastSeen: new Date().toISOString() } : u)
      saveUsers(updated)
      localStorage.setItem('nexus-session', JSON.stringify({ ...user, passwordHash: undefined }))
      set({ currentUser: { ...user, passwordHash: undefined }, users: updated, loading: false, authError: null })
      return true
    },

    register: async (username, email, password) => {
      set({ loading: true, authError: null })
      await new Promise(r => setTimeout(r, 400))

      const users = get().users
      if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        set({ authError: 'Username already taken. Choose another.', loading: false })
        return false
      }
      if (email && users.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
        set({ authError: 'Email already registered.', loading: false })
        return false
      }
      if (password.length < 6) {
        set({ authError: 'Password must be at least 6 characters.', loading: false })
        return false
      }

      const hash = await hashPassword(password)
      const newUser = {
        id: Date.now(),
        username,
        email: email || '',
        role: users.length === 0 ? 'admin' : 'user',
        avatar: username[0].toUpperCase(),
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        passwordHash: hash,
      }

      const updated = [...users, newUser]
      saveUsers(updated)
      localStorage.setItem('nexus-session', JSON.stringify({ ...newUser, passwordHash: undefined }))
      set({ users: updated, currentUser: { ...newUser, passwordHash: undefined }, loading: false, authError: null })
      return true
    },

    logout: () => {
      localStorage.removeItem('nexus-session')
      set({ currentUser: null, authError: null })
    },

    updateUser: (id, changes) => {
      const users = get().users.map(u => u.id === id ? { ...u, ...changes } : u)
      saveUsers(users)
      const cur = get().currentUser
      if (cur?.id === id) {
        const updated = { ...cur, ...changes, passwordHash: undefined }
        localStorage.setItem('nexus-session', JSON.stringify(updated))
        set({ users, currentUser: updated })
      } else {
        set({ users })
      }
    },

    deleteUser: (id) => {
      const users = get().users.filter(u => u.id !== id)
      saveUsers(users)
      set({ users })
    },

    addUser: async (username, email, password, role = 'user') => {
      const hash = await hashPassword(password)
      const newUser = {
        id: Date.now(),
        username, email, role,
        avatar: username[0].toUpperCase(),
        createdAt: new Date().toISOString(),
        lastSeen: null,
        passwordHash: hash,
      }
      const users = [...get().users, newUser]
      saveUsers(users)
      set({ users })
      return newUser
    },

    clearError: () => set({ authError: null }),
  }
})
