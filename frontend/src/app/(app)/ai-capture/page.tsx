'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Send, Loader2, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AddExpenseForm } from '@/components/expenses/AddExpenseForm'
import type { AIExpense } from '@/types'
import { CATEGORY_ICONS, CURRENCIES } from '@/types'
import { formatCurrency } from '@/lib/currency'
import { useAuthStore } from '@/stores/useAuthStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
  expenses?: AIExpense[]
}

export default function AICaptурePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! Tell me what you spent today and I'll capture it. For example: \"Spent $12 on lunch, $3 on coffee, and $45 on groceries at Whole Foods\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<AIExpense | null>(null)
  const profile = useAuthStore((s) => s.profile)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMessage,
          defaultCurrency: profile?.currency_preference || 'USD',
        }),
      })

      if (!res.ok) throw new Error('AI service error')
      const { expenses } = await res.json()

      if (expenses.length === 0) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: "I couldn't find any expenses in that message. Try something like \"$20 on dinner\" or \"paid 500 INR for transport\"." },
        ])
      } else {
        const summary = expenses
          .map((e: AIExpense) => `${CATEGORY_ICONS[e.category]} ${e.description}: ${formatCurrency(e.amount, e.currency)}`)
          .join('\n')
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Found ${expenses.length} expense${expenses.length > 1 ? 's' : ''}:\n${summary}\n\nClick any to add it to your expenses.`,
            expenses,
          },
        ])
      }
    } catch {
      toast.error('AI capture failed. Check your API key.')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble processing that. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg bg-indigo-100 p-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Expense Capture</h1>
          <p className="text-xs text-muted-foreground">Describe your spends in plain English</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border shadow-sm text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.expenses && (
                <div className="mt-3 space-y-2">
                  {msg.expenses.map((expense, j) => (
                    <button
                      key={j}
                      onClick={() => setSelectedExpense(expense)}
                      className="w-full flex items-center justify-between rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{CATEGORY_ICONS[expense.category]}</span>
                        <span className="text-xs font-medium text-gray-700">{expense.description}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-indigo-700">
                          {formatCurrency(expense.amount, expense.currency)}
                        </span>
                        <Plus className="h-3 w-3 text-indigo-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border shadow-sm rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="e.g. Spent $25 on dinner and $8 on coffee..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
          }}
          className="resize-none min-h-[52px] max-h-32"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="self-end bg-indigo-600 hover:bg-indigo-700 px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Add expense dialog */}
      <Dialog open={!!selectedExpense} onOpenChange={(open) => !open && setSelectedExpense(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add AI-Captured Expense</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <AddExpenseForm
              prefillData={{
                description: selectedExpense.description,
                amount: selectedExpense.amount,
                currency: selectedExpense.currency,
                category: selectedExpense.category,
              }}
              onSuccess={() => {
                setSelectedExpense(null)
                toast.success('Expense added!')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
