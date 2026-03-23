'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Fingerprint, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function BiometricButton() {
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if WebAuthn is supported and there's a stored credential
    const hasCredential = localStorage.getItem('splitit_passkey_user_id')
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      hasCredential
    ) {
      setSupported(true)
    }
  }, [])

  const handleBiometric = async () => {
    setLoading(true)
    try {
      // Check if session still valid first
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
        return
      }
      toast.info('Session expired. Please sign in with OTP.')
    } catch {
      toast.error('Biometric authentication failed')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-indigo-200 hover:bg-indigo-50"
      onClick={handleBiometric}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-5 w-5 text-indigo-600" />
      )}
      Sign in with Biometrics
    </Button>
  )
}
