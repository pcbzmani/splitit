import Anthropic from '@anthropic-ai/sdk'
import type { AIExpense, ExpenseCategory } from '@/types'

// Only used server-side (API routes)
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function captureExpensesFromText(
  text: string,
  defaultCurrency = 'USD'
): Promise<AIExpense[]> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract expense data from this text. Return a JSON array only, no explanation.
Each expense object must have: description (string), amount (number), currency (ISO 4217 code), category (one of: food, transport, accommodation, entertainment, utilities, shopping, health, other).
If currency is not mentioned, use "${defaultCurrency}".
If multiple expenses are mentioned, return all of them.

Text: "${text}"

Return only valid JSON array like: [{"description":"...","amount":12.50,"currency":"USD","category":"food"}]`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') return []

  try {
    const jsonMatch = content.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    const parsed = JSON.parse(jsonMatch[0]) as AIExpense[]
    return parsed.filter(
      (e) =>
        typeof e.description === 'string' &&
        typeof e.amount === 'number' &&
        e.amount > 0 &&
        typeof e.currency === 'string'
    )
  } catch {
    return []
  }
}

export async function analyzeSpending(
  expenses: { description: string; amount: number; currency: string; category: string; created_at: string }[],
  preferredCurrency = 'USD'
): Promise<string> {
  const summary = expenses
    .map((e) => `${e.description}: ${e.amount} ${e.currency} (${e.category})`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Analyze these expenses and give a brief, friendly spending summary in 3-4 bullet points. Include top categories, total, and one actionable saving tip. Keep it concise.

Expenses:
${summary}

Preferred currency: ${preferredCurrency}`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : 'Unable to analyze spending.'
}

export async function suggestSplit(
  description: string,
  amount: number,
  currency: string,
  participants: string[]
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `For a shared expense "${description}" of ${amount} ${currency} among ${participants.length} people (${participants.join(', ')}), suggest the fairest split method in one sentence. Options: equal split, or explain if percentage/custom makes more sense.`,
      },
    ],
  })

  const content = message.content[0]
  return content.type === 'text' ? content.text : `Split equally: ${(amount / participants.length).toFixed(2)} ${currency} each.`
}
