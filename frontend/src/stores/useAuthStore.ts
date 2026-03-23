'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types'

interface AuthState {
  profile: Profile | null
  pendingEmail: string | null
  pendingPhone: string | null
  setProfile: (profile: Profile | null) => void
  setPendingEmail: (email: string | null) => void
  setPendingPhone: (phone: string | null) => void
  clearPending: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      profile: null,
      pendingEmail: null,
      pendingPhone: null,
      setProfile: (profile) => set({ profile }),
      setPendingEmail: (email) => set({ pendingEmail: email, pendingPhone: null }),
      setPendingPhone: (phone) => set({ pendingPhone: phone, pendingEmail: null }),
      clearPending: () => set({ pendingEmail: null, pendingPhone: null }),
    }),
    { name: 'splitit-auth' }
  )
)
