'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { MessageSquare, Star, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { feedbackSchema, type FeedbackFormData } from '@/lib/validators/expense'

// Re-use the same module
interface FeedbackFormValues {
  type: 'bug' | 'feature' | 'general'
  message: string
  rating?: number
  email?: string
}

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [type, setType] = useState<'bug' | 'feature' | 'general'>('general')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.length < 10) {
      toast.error('Please provide more detail (at least 10 characters)')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        type,
        message,
        rating: rating || null,
      })

      if (error) throw error
      setSubmitted(true)
      toast.success('Thanks for your feedback!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
        <Card className="max-w-sm w-full text-center border-0 shadow-lg">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="text-5xl">🙏</div>
            <h2 className="text-xl font-bold">Thank you!</h2>
            <p className="text-sm text-muted-foreground">Your feedback helps us make SplitIt better for everyone.</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
              <a href="/dashboard">Back to App</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 p-3 mb-4">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Send Feedback</h1>
          <p className="text-muted-foreground mt-2">We read every message. Help us improve!</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>Feedback type</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">💬 General feedback</SelectItem>
                    <SelectItem value="bug">🐛 Bug report</SelectItem>
                    <SelectItem value="feature">✨ Feature request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>How would you rate SplitIt?</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="message">Your message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 min-h-[120px] resize-none"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send Feedback
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
