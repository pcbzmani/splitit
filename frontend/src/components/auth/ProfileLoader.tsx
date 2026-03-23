'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Profile } from '@/types'

export function ProfileLoader({ userId }: { userId: string }) {
  const setProfile = useAuthStore((s) => s.setProfile)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
      })
  }, [userId, setProfile])

  return null
}
