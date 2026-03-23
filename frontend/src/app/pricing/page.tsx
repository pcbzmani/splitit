'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Sparkles, Heart, SplitSquareHorizontal, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const FREE_FEATURES = [
  '3 groups',
  '50 expenses per month',
  'Basic AI capture (10/month)',
  'Multi-currency support',
  'Friend splits',
]

const PRO_FEATURES = [
  'Unlimited groups',
  'Unlimited expenses',
  'Full AI capture & analysis',
  'Receipt photo scanning',
  'Export to CSV/PDF',
  'Priority support',
  'Pro badge',
]

export default function PricingPage() {
  const [donationAmount, setDonationAmount] = useState('5')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to open checkout')
      }
    } catch {
      toast.error('Stripe not configured yet')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount)
    if (isNaN(amount) || amount < 1) {
      toast.error('Minimum donation is $1')
      return
    }
    setLoadingPlan('donate')
    try {
      const res = await fetch('/api/stripe/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(amount * 100) }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to open donation checkout')
      }
    } catch {
      toast.error('Stripe not configured yet')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-indigo-100 px-4 py-2">
            <SplitSquareHorizontal className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">SplitIt Plans</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple, honest pricing</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you need more. Support the project if you love it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold text-gray-900">$0 <span className="text-sm font-normal text-muted-foreground">forever</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Get started free</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="border-2 border-indigo-600 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600">Most Popular</Badge>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Pro <Sparkles className="h-4 w-4 text-indigo-600" />
              </CardTitle>
              <CardDescription>For power users and teams</CardDescription>
              <div>
                <div className="text-3xl font-bold text-gray-900">$4.99 <span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <div className="text-sm text-muted-foreground">or $39/year (save 35%)</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === 'monthly' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Subscribe Monthly — $4.99
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-indigo-200 text-indigo-700"
                  onClick={() => handleSubscribe('annual')}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === 'annual' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Subscribe Annual — $39/year
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donation */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-pink-50 to-purple-50">
          <CardContent className="flex flex-col md:flex-row items-center gap-6 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-pink-100 p-3">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Support the project</h3>
                <p className="text-sm text-muted-foreground">One-time donation to keep SplitIt free and growing</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                min="1"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="w-20 text-center"
              />
              <Button
                onClick={handleDonate}
                disabled={!!loadingPlan}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {loadingPlan === 'donate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className="mr-2 h-4 w-4" />}
                Donate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
