'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/currency'

interface Debt {
  user_id: string
  display_name: string
  amount: number
  currency: string
  split_ids: string[]
}

export default function SettlePage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [settling, setSettling] = useState<string | null>(null)

  const fetchDebts = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find unsettled splits where I owe others
    const { data } = await supabase
      .from('expense_splits')
      .select('id, amount, expenses!inner(currency, paid_by, profiles!expenses_paid_by_fkey(id, display_name))')
      .eq('user_id', user.id)
      .eq('is_settled', false)
      .neq('expenses.paid_by', user.id)

    // Group by creditor
    const grouped: Record<string, Debt> = {}
    for (const split of (data || [])) {
      const expense = (split as any).expenses
      const payer = expense.profiles
      if (!payer) continue
      if (!grouped[payer.id]) {
        grouped[payer.id] = {
          user_id: payer.id,
          display_name: payer.display_name,
          amount: 0,
          currency: expense.currency,
          split_ids: [],
        }
      }
      grouped[payer.id].amount += split.amount
      grouped[payer.id].split_ids.push(split.id)
    }

    setDebts(Object.values(grouped))
    setLoading(false)
  }, [])

  useEffect(() => { fetchDebts() }, [fetchDebts])

  const handleSettle = async (debt: Debt) => {
    setSettling(debt.user_id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('expense_splits')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .in('id', debt.split_ids)

      if (error) throw error

      // Record settlement
      await supabase.from('settlements').insert({
        from_user: user.id,
        to_user: debt.user_id,
        amount: debt.amount,
        currency: debt.currency,
      })

      setDebts((prev) => prev.filter((d) => d.user_id !== debt.user_id))
      toast.success(`Settled ${formatCurrency(debt.amount, debt.currency)} with ${debt.display_name}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to settle')
    } finally {
      setSettling(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settle Up</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : debts.length === 0 ? (
        <div className="py-16 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <p className="font-medium text-gray-700">All settled up!</p>
          <p className="text-sm text-muted-foreground mt-1">You don't owe anyone right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">You owe the following people:</p>
          {debts.map((debt) => (
            <Card key={debt.user_id} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-red-100 text-red-700">
                    {debt.display_name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{debt.display_name}</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(debt.amount, debt.currency)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleSettle(debt)}
                  disabled={!!settling}
                >
                  {settling === debt.user_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Settle <ArrowRight className="ml-1 h-3 w-3" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
