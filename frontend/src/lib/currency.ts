const CACHE_KEY = 'splitit_fx_rates'
const CACHE_TTL = 3600000 // 1 hour

interface RatesCache {
  base: string
  rates: Record<string, number>
  timestamp: number
}

export async function getExchangeRates(base = 'USD'): Promise<Record<string, number>> {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed: RatesCache = JSON.parse(cached)
      if (parsed.base === base && Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.rates
      }
    }
  }

  try {
    const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`)
    const data = await res.json()
    const rates = { ...data.rates, [base]: 1 }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ base, rates, timestamp: Date.now() }))
    }
    return rates
  } catch {
    return { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, CAD: 1.36, AUD: 1.53 }
  }
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  if (from === to) return amount
  const rates = await getExchangeRates(from)
  const rate = rates[to]
  if (!rate) return amount
  return Math.round(amount * rate * 100) / 100
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getCurrencySymbol(currency: string): string {
  try {
    return (0).toLocaleString('en', { style: 'currency', currency, minimumFractionDigits: 0 })
      .replace(/\d/g, '').trim()
  } catch {
    return currency
  }
}
