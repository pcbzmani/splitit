'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save, LogOut, Loader2, User, Globe, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { CURRENCIES } from '@/types'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { profile, setProfile } = useAuthStore()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [currency, setCurrency] = useState(profile?.currency_preference || 'USD')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name)
      setCurrency(profile.currency_preference)
    }
  }, [profile])

  const handleSave = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim(), currency_preference: currency })
        .eq('id', profile!.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data as any)
      toast.success('Settings saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    localStorage.removeItem('splitit_passkey_user_id')
    router.push('/login')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Email / Phone</Label>
            <Input value={profile?.email || profile?.phone || '—'} disabled className="mt-1 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Default currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-sm">Plan</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={profile?.subscription_tier === 'pro' ? 'default' : 'secondary'}
                className={profile?.subscription_tier === 'pro' ? 'bg-indigo-600' : ''}>
                {profile?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
              </Badge>
            </div>
          </div>
          {profile?.subscription_tier !== 'pro' && (
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <a href="/pricing">Upgrade</a>
            </Button>
          )}
        </CardContent>
      </Card>

      <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Changes
      </Button>

      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  )
}
