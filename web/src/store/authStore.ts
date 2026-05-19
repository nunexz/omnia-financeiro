import { create } from 'zustand'

interface User {
  id: string
  email: string
  nome: string
  photoUrl?: string
  is_admin: boolean
  totpEnabled: boolean
}

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  setTotpEnabled: (enabled: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Load from localStorage on init
  const savedToken = localStorage.getItem('auth_token')
  const savedUser = localStorage.getItem('auth_user')

  return {
    token: savedToken,
    user: savedUser ? JSON.parse(savedUser) : null,

    setAuth: (token: string, user: User) => {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_user', JSON.stringify(user))
      set({ token, user })
    },

    logout: () => {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      set({ token: null, user: null })
    },

    setTotpEnabled: (enabled: boolean) => {
      set((state) => ({
        user: state.user ? { ...state.user, totpEnabled: enabled } : null,
      }))
    },
  }
})
