export type SubscriptionTier = 'free' | 'pro' | 'supporter'
export type SplitType = 'equal' | 'percentage' | 'exact' | 'shares'
export type FriendshipStatus = 'pending' | 'accepted' | 'rejected'
export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'entertainment'
  | 'utilities'
  | 'shopping'
  | 'health'
  | 'other'

export interface Profile {
  id: string
  display_name: string
  phone: string | null
  email: string | null
  avatar_url: string | null
  currency_preference: string
  subscription_tier: SubscriptionTier
  created_at: string
}

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: FriendshipStatus
  created_at: string
  friend?: Profile
}

export interface Group {
  id: string
  name: string
  description: string | null
  created_by: string
  currency: string
  created_at: string
  members?: GroupMember[]
  balance?: number
}

export interface GroupMember {
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profile?: Profile
}

export interface Expense {
  id: string
  description: string
  amount: number
  currency: string
  paid_by: string
  group_id: string | null
  split_type: SplitType
  category: ExpenseCategory
  receipt_url: string | null
  ai_captured: boolean
  created_at: string
  splits?: ExpenseSplit[]
  payer?: Profile
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  is_settled: boolean
  settled_at: string | null
  profile?: Profile
}

export interface Settlement {
  id: string
  from_user: string
  to_user: string
  amount: number
  currency: string
  group_id: string | null
  created_at: string
}

export interface Balance {
  user_id: string
  profile: Profile
  amount: number // positive = they owe you, negative = you owe them
  currency: string
}

export interface AIExpense {
  description: string
  amount: number
  currency: string
  category: ExpenseCategory
}

export interface FeedbackItem {
  id: string
  user_id: string | null
  type: 'bug' | 'feature' | 'general'
  message: string
  rating: number | null
  created_at: string
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
]

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍔',
  transport: '🚗',
  accommodation: '🏠',
  entertainment: '🎬',
  utilities: '💡',
  shopping: '🛍️',
  health: '💊',
  other: '📦',
}
