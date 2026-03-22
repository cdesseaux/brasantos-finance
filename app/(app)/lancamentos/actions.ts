'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ExpenseFormData } from '@/schemas/expense'
import type { RevenueFormData } from '@/schemas/revenue'

export async function saveExpenseTransaction(data: ExpenseFormData & { id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const payload = { ...data, created_by: user.id }
  const { error } = data.id
    ? await supabase.from('expense_transactions').update(payload).eq('id', data.id)
    : await supabase.from('expense_transactions').insert(payload)

  if (error) throw error
  revalidatePath('/lancamentos')
}

export async function deleteExpenseTransactionAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('expense_transactions').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/lancamentos')
}

export async function saveRevenueTransaction(data: RevenueFormData & { id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const payload = { ...data, created_by: user.id }
  const { error } = data.id
    ? await supabase.from('revenue_transactions').update(payload).eq('id', data.id)
    : await supabase.from('revenue_transactions').insert(payload)

  if (error) throw error
  revalidatePath('/lancamentos')
}

export async function deleteRevenueTransactionAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('revenue_transactions').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/lancamentos')
}
