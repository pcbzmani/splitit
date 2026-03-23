'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SplitSquareHorizontal, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { Badge } from '@/components/ui/badge'

export function Navbar() {
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/login')
  }

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-lg flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600">
          <SplitSquareHorizontal className="h-6 w-6" />
          SplitIt
        </Link>
        <div className="flex items-center gap-2">
          {profile?.subscription_tier === 'pro' && (
            <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-700">Pro</Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email || profile?.phone || ''}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pricing">Upgrade to Pro</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/feedback">Send Feedback</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
