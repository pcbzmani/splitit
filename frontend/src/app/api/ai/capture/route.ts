import { NextRequest, NextResponse } from 'next/server'
import { captureExpensesFromText } from '@/lib/anthropic'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { text, defaultCurrency = 'USD' } = await req.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const expenses = await captureExpensesFromText(text, defaultCurrency)
    return NextResponse.json({ expenses })
  } catch (err) {
    console.error('AI capture error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
