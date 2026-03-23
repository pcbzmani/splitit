'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { expenseSchema, type ExpenseFormData } from '@/lib/validators/expense'
import { CURRENCIES, type Expense, type ExpenseCategory } from '@/types'
import { useAuthStore } from '@/stores/useAuthStore'

const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'accommodation', 'entertainment', 'utilities', 'shopping', 'health', 'other']
const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '🍔 Food', transport: '🚗 Transport', accommodation: '🏠 Accommodation',
  entertainment: '🎬 Entertainment', utilities: '💡 Utilities', shopping: '🛍️ Shopping',
  health: '💊 Health', other: '📦 Other',
}

interface Props {
  onSuccess?: (expense: Expense) => void
  prefillData?: Partial<ExpenseFormData>
}

export function AddExpenseForm({ onSuccess, prefillData }: Props) {
  const [loading, setLoading] = useState(false)
  const profile = useAuthStore((s) => s.profile)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      currency: profile?.currency_preference || 'USD',
      category: 'other',
      split_type: 'equal',
      ...prefillData,
    },
  })

  const currency = watch('currency')
  const category = watch('category')

  const onSubmit = async (data: unknown) => {
    const formData = data as ExpenseFormData
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert({
          description: formData.description,
          amount: formData.amount,
          currency: formData.currency,
          category: formData.category,
          split_type: formData.split_type,
          paid_by: user.id,
          group_id: formData.group_id || null,
          ai_captured: !!prefillData,
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Expense added!')
      onSuccess?.(expense as Expense)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" placeholder="Lunch at restaurant" {...register('description')} className="mt-1" />
        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount')} className="mt-1" />
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(v) => setValue('currency', v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={(v) => setValue('category', v as ExpenseCategory)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Add Expense
      </Button>
    </form>
  )
}
