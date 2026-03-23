'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import { ExpenseList } from '@/components/expenses/ExpenseList'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/types'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchExpenses = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('paid_by', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setExpenses(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const filtered = expenses.filter((e) =>
    e.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <AddExpenseForm
              onSuccess={(expense) => {
                setExpenses((prev) => [expense, ...prev])
                setDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ExpenseList
        expenses={filtered}
        loading={loading}
        onDelete={(id) => setExpenses((prev) => prev.filter((e) => e.id !== id))}
      />
    </div>
  )
}
