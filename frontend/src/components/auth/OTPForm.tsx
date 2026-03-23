'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'

export function OTPForm() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { pendingEmail, pendingPhone, clearPending } = useAuthStore()

  useEffect(() => {
    inputRefs.current[0]?.focus()
    const timer = setInterval(() => setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      verifyOTP(text)
    }
  }

  const verifyOTP = async (token: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      let result

      if (pendingEmail) {
        result = await supabase.auth.verifyOtp({ email: pendingEmail, token, type: 'email' })
      } else if (pendingPhone) {
        result = await supabase.auth.verifyOtp({ phone: pendingPhone, token, type: 'sms' })
      } else {
        toast.error('Session expired. Please start over.')
        router.push('/login')
        return
      }

      if (result.error) throw result.error

      // Create profile if first login
      if (result.data.user) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', result.data.user.id)
          .single()

        if (!existingProfile) {
          const displayName = pendingEmail?.split('@')[0] || pendingPhone || 'User'
          await supabase.from('profiles').insert({
            id: result.data.user.id,
            display_name: displayName,
            email: pendingEmail || null,
            phone: pendingPhone || null,
            currency_preference: 'USD',
            subscription_tier: 'free',
          })
        }

        localStorage.setItem('splitit_passkey_user_id', result.data.user.id)
      }

      clearPending()
      toast.success('Signed in successfully!')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    const supabase = createClient()
    if (pendingEmail) {
      await supabase.auth.signInWithOtp({ email: pendingEmail })
    } else if (pendingPhone) {
      await supabase.auth.signInWithOtp({ phone: pendingPhone })
    }
    setResendTimer(60)
    toast.success('New OTP sent!')
  }

  const destination = pendingEmail || pendingPhone || 'your contact'

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Enter verification code</CardTitle>
        <CardDescription>
          Sent to <span className="font-medium text-foreground">{destination}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-xl font-bold border-2 focus:border-indigo-600"
              disabled={loading}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={handleResend}
          disabled={resendTimer > 0}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
        </Button>

        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground"
          onClick={() => { clearPending(); router.push('/login') }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
        </Button>
      </CardContent>
    </Card>
  )
}
