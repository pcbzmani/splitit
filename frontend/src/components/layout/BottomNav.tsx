'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, Users, Sparkles, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/ai-capture', label: 'AI', icon: Sparkles },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-lg flex">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors',
                active ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
