import { createClient } from '@/lib/supabase/server'

export async function getRevenueTransactions(filters: { competencia?: string; company_id?: string } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('revenue_transactions')
    .select('*, companies(name), clients(name), chart_of_accounts(description)')
    .order('issue_date', { ascending: false })
  if (filters.competencia) query = query.eq('competencia', filters.competencia)
  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getDueRevenues(days = 7) {
  const supabase = await createClient()
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)
  const { data, error } = await supabase
    .from('revenue_transactions')
    .select('*, companies(name), clients(name)')
    .eq('status', 'A RECEBER')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', future.toISOString().split('T')[0])
    .order('due_date')
  if (error) throw error
  return data
}
