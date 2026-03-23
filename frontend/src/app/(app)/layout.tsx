import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { ProfileLoader } from '@/components/auth/ProfileLoader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <ProfileLoader userId={user.id} />
      <Navbar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-24 pt-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
