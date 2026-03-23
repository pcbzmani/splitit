'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Phone, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { BiometricButton } from './BiometricButton'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setPendingEmail, setPendingPhone } = useAuthStore()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setPendingEmail(email)
      router.push('/verify-otp')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setLoading(true)
    try {
      const supabase = createClient()
      const formatted = phone.startsWith('+') ? phone : `+${phone}`
      const { error } = await supabase.auth.signInWithOtp({
        phone: formatted,
        options: { shouldCreateUser: true },
      })
      if (error) throw error
      setPendingPhone(formatted)
      router.push('/verify-otp')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in with email or phone number</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <BiometricButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or continue with OTP</span>
          </div>
        </div>

        <Tabs defaultValue="email">
          <TabsList className="w-full">
            <TabsTrigger value="email" className="flex-1">
              <Mail className="mr-2 h-4 w-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex-1">
              <Phone className="mr-2 h-4 w-4" /> Phone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="mt-4">
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP to Email
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="phone" className="mt-4">
            <form onSubmit={handlePhoneLogin} className="space-y-3">
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">Include country code (e.g. +1, +44, +91)</p>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP via SMS
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
