import { NextRequest, NextResponse } from 'next/server'
import { analyzeSpending } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get this month's expenses
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: expenses } = await supabase
      .from('expenses')
      .select('description, amount, currency, category, created_at')
      .eq('paid_by', user.id)
      .gte('created_at', startOfMonth.toISOString())
      .order('created_at', { ascending: false })

    if (!expenses || expenses.length === 0) {
      return NextResponse.json({ analysis: "No expenses found this month. Start tracking your spending!" })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('currency_preference')
      .eq('id', user.id)
      .single()

    const analysis = await analyzeSpending(expenses, profile?.currency_preference || 'USD')
    return NextResponse.json({ analysis })
  } catch (err) {
    console.error('AI analyze error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
