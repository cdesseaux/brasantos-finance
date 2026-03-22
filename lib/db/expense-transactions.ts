import { createClient } from '@/lib/supabase/server'

export interface ExpenseFilters {
  competencia?: string
  company_id?: string
  status?: string
  account_id?: string
}

export async function getExpenseTransactions(filters: ExpenseFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('expense_transactions')
    .select(`
      *,
      companies(name),
      clients(name),
      suppliers(name),
      chart_of_accounts(code, description, category)
    `)
    .order('due_date', { ascending: true })

  if (filters.competencia) query = query.eq('competencia', filters.competencia)
  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.account_id) query = query.eq('account_id', filters.account_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getDueExpenses(days = 7) {
  const supabase = await createClient()
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)

  const { data, error } = await supabase
    .from('expense_transactions')
    .select('*, companies(name)')
    .eq('status', 'A PAGAR')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', future.toISOString().split('T')[0])
    .order('due_date')

  if (error) throw error
  return data
}

export async function deleteExpenseTransaction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('expense_transactions').delete().eq('id', id)
  if (error) throw error
}
