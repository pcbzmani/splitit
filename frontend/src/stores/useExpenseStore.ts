'use client'
import { create } from 'zustand'
import type { Expense, Group, Balance, Profile } from '@/types'

interface ExpenseState {
  expenses: Expense[]
  groups: Group[]
  friends: Profile[]
  balances: Balance[]
  isLoading: boolean
  setExpenses: (expenses: Expense[]) => void
  addExpense: (expense: Expense) => void
  removeExpense: (id: string) => void
  setGroups: (groups: Group[]) => void
  addGroup: (group: Group) => void
  setFriends: (friends: Profile[]) => void
  setBalances: (balances: Balance[]) => void
  setLoading: (loading: boolean) => void
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  groups: [],
  friends: [],
  balances: [],
  isLoading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((s) => ({ expenses: [expense, ...s.expenses] })),
  removeExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
  setGroups: (groups) => set({ groups }),
  addGroup: (group) => set((s) => ({ groups: [group, ...s.groups] })),
  setFriends: (friends) => set({ friends }),
  setBalances: (balances) => set({ balances }),
  setLoading: (isLoading) => set({ isLoading }),
}))
