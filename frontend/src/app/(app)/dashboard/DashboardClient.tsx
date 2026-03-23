'use client'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/currency'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Expense } from '@/types'
import { CATEGORY_ICONS } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  expenses: Expense[]
  totalOwedToMe: number
  totalIOwe: number
  userId: string
}

export function DashboardClient({ expenses, totalOwedToMe, totalIOwe, userId }: Props) {
  const profile = useAuthStore((s) => s.profile)
  const currency = profile?.currency_preference || 'USD'
  const netBalance = totalOwedToMe - totalIOwe

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hey, {profile?.display_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Here's your spending overview</p>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Owed to you</span>
            </div>
            <p className="text-xl font-bold text-green-800">
              {formatCurrency(totalOwedToMe, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">You owe</span>
            </div>
            <p className="text-xl font-bold text-red-800">
              {formatCurrency(totalIOwe, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net balance */}
      <Card className={`border-0 ${netBalance >= 0 ? 'bg-indigo-50' : 'bg-orange-50'}`}>
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">Net balance</p>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
              {netBalance >= 0 ? '+' : ''}{formatCurrency(Math.abs(netBalance), currency)}
            </p>
          </div>
          {netBalance < 0 && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/settle">Settle Up</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button asChild className="h-14 flex-col gap-1 bg-indigo-600 hover:bg-indigo-700">
          <Link href="/expenses">
            <Plus className="h-5 w-5" />
            <span className="text-xs">Add Expense</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-14 flex-col gap-1 border-indigo-200 hover:bg-indigo-50">
          <Link href="/ai-capture">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <span className="text-xs">AI Capture</span>
          </Link>
        </Button>
      </div>

      {/* Recent expenses */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Recent Expenses</CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-indigo-600">
            <Link href="/expenses">
              See all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 p-4 pt-0">
          {expenses.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">No expenses yet</p>
              <Button asChild size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-700">
                <Link href="/expenses">Add your first expense</Link>
              </Button>
            </div>
          ) : (
            expenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">{CATEGORY_ICONS[expense.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
                    {expense.ai_captured && (
                      <Badge variant="secondary" className="ml-2 text-xs py-0 px-1">AI</Badge>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(expense.amount, expense.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {expense.paid_by === userId ? 'you paid' : 'shared'}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
