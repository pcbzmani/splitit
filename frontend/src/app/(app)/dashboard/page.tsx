import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch recent expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, splits:expense_splits(*)')
    .or(`paid_by.eq.${user.id},splits.user_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch balances (what others owe you minus what you owe)
  const { data: owedToMe } = await supabase
    .from('expense_splits')
    .select('amount, currency, expenses!inner(paid_by)')
    .eq('expenses.paid_by', user.id)
    .eq('is_settled', false)
    .neq('user_id', user.id)

  const { data: iOwe } = await supabase
    .from('expense_splits')
    .select('amount, currency, expenses!inner(paid_by)')
    .eq('user_id', user.id)
    .eq('is_settled', false)
    .neq('expenses.paid_by', user.id)

  const totalOwedToMe = (owedToMe || []).reduce((sum, s) => sum + s.amount, 0)
  const totalIOwe = (iOwe || []).reduce((sum, s) => sum + s.amount, 0)

  return (
    <DashboardClient
      expenses={expenses || []}
      totalOwedToMe={totalOwedToMe}
      totalIOwe={totalIOwe}
      userId={user.id}
    />
  )
}
