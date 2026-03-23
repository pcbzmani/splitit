'use client'
import { toast } from 'sonner'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/currency'
import { CATEGORY_ICONS, type Expense } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface Props {
  expenses: Expense[]
  loading: boolean
  onDelete?: (id: string) => void
}

export function ExpenseList({ expenses, loading, onDelete }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      onDelete?.(id)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border bg-white p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl mb-3">🧾</p>
        <p className="font-medium text-gray-700">No expenses found</p>
        <p className="text-sm text-muted-foreground mt-1">Add your first expense above</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:border-indigo-200 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl flex-shrink-0">
            {CATEGORY_ICONS[expense.category]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{expense.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(expense.created_at), { addSuffix: true })}
              </p>
              {expense.ai_captured && (
                <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-indigo-100 text-indigo-700">AI</Badge>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-sm">{formatCurrency(expense.amount, expense.currency)}</p>
            <p className="text-xs text-muted-foreground capitalize">{expense.category}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-500 flex-shrink-0"
            onClick={() => handleDelete(expense.id)}
            disabled={deleting === expense.id}
          >
            {deleting === expense.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  )
}
