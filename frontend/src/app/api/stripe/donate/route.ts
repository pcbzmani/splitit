import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder') {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    const { amount } = await req.json() // amount in cents
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum donation is $1' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'SplitIt Donation', description: 'Support the project ❤️' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?donated=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe donate error:', err)
    return NextResponse.json({ error: 'Failed to create donation session' }, { status: 500 })
  }
}
