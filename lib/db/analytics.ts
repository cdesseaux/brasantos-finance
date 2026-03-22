import { createClient } from '@/lib/supabase/server'
import { calculateClientDRE } from '@/lib/utils/allocation'

export async function getMonthlySummaryByCompany(competencia: string) {
  const supabase = await createClient()

  const [{ data: expenses }, { data: revenues }] = await Promise.all([
    supabase
      .from('expense_transactions')
      .select('company_id, total, companies(name)')
      .eq('competencia', competencia),
    supabase
      .from('revenue_transactions')
      .select('company_id, net_value, companies(name)')
      .eq('competencia', competencia),
  ])

  // Group by company
  const companies: Record<string, { name: string; revenue: number; expense: number }> = {}

  for (const r of revenues ?? []) {
    const key = r.company_id ?? 'unknown'
    const companyName = (r as unknown as { company_id: string | null; net_value: number | null; companies: { name: string } | null }).companies?.name ?? ''
    if (!companies[key]) companies[key] = { name: companyName, revenue: 0, expense: 0 }
    companies[key].revenue += r.net_value ?? 0
  }
  for (const e of expenses ?? []) {
    const key = e.company_id ?? 'unknown'
    const companyName = (e as unknown as { company_id: string | null; total: number | null; companies: { name: string } | null }).companies?.name ?? ''
    if (!companies[key]) companies[key] = { name: companyName, revenue: 0, expense: 0 }
    companies[key].expense += e.total ?? 0
  }

  return Object.entries(companies).map(([id, data]) => ({
    company_id: id,
    ...data,
    balance: data.revenue - data.expense,
  }))
}

export async function getClientDREData(competencia: string) {
  const supabase = await createClient()
  const [{ data: revenues }, { data: expenses }, { data: clients }] = await Promise.all([
    supabase.from('revenue_transactions').select('client_id, net_value, clients(name, segment)')
      .eq('competencia', competencia),
    supabase.from('expense_transactions').select('client_id, total, clients(name, segment)')
      .eq('competencia', competencia),
    supabase.from('clients').select('id, name, segment').not('segment', 'in', '("BANCO")'),
  ])

  const totalHoldingRevenue = revenues?.reduce((s, r) => s + (r.net_value ?? 0), 0) ?? 0

  // Overhead = expenses linked to ADM/OPERACIONAL clients or null client_id
  const overhead = expenses
    ?.filter(e => {
      const seg = (e as unknown as { client_id: string | null; total: number | null; clients: { segment: string } | null }).clients?.segment ?? ''
      return !e.client_id || ['ADM', 'OPERACIONAL'].includes(seg)
    })
    .reduce((s, e) => s + (e.total ?? 0), 0) ?? 0

  const clientRevenue: Record<string, number> = {}
  const clientDirectExpense: Record<string, number> = {}

  for (const r of revenues ?? []) {
    const seg = (r as unknown as { client_id: string | null; net_value: number | null; clients: { name: string; segment: string } | null }).clients?.segment ?? ''
    if (['ADM', 'OPERACIONAL', 'BANCO'].includes(seg)) continue
    if (!r.client_id) continue
    clientRevenue[r.client_id] = (clientRevenue[r.client_id] ?? 0) + (r.net_value ?? 0)
  }
  for (const e of expenses ?? []) {
    const seg = (e as unknown as { client_id: string | null; total: number | null; clients: { name: string; segment: string } | null }).clients?.segment ?? ''
    if (!e.client_id || ['ADM', 'OPERACIONAL', 'BANCO'].includes(seg)) continue
    clientDirectExpense[e.client_id] = (clientDirectExpense[e.client_id] ?? 0) + (e.total ?? 0)
  }

  const results = Object.keys(clientRevenue).map(clientId => {
    return calculateClientDRE({
      clientId,
      revenue: clientRevenue[clientId] ?? 0,
      directExpenses: clientDirectExpense[clientId] ?? 0,
      overhead,
      totalHoldingRevenue,
    })
  })

  return { results, overhead, totalHoldingRevenue, clients: clients ?? [] }
}

export async function getClientCrossTable(year: number) {
  const supabase = await createClient()
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  )
  const results = await Promise.all(months.map(comp => getClientDREData(comp)))

  const { data: clientsData } = await supabase.from('clients').select('id, name')
  const clientNames: Record<string, string> = {}
  for (const c of clientsData ?? []) clientNames[c.id] = c.name

  const table: Record<string, { name: string; months: Record<string, number> }> = {}
  results.forEach(({ results: monthResults }, idx) => {
    monthResults.forEach(r => {
      if (!table[r.clientId]) {
        table[r.clientId] = { name: clientNames[r.clientId] ?? r.clientId, months: {} }
      }
      table[r.clientId].months[months[idx]] = r.netResult
    })
  })
  return table
}

export async function getMonthlyReport(competencia: string, company_id?: string) {
  const supabase = await createClient()
  let expQ = supabase.from('expense_transactions')
    .select('total, chart_of_accounts(account, category)')
    .eq('competencia', competencia)
  let revQ = supabase.from('revenue_transactions')
    .select('net_value').eq('competencia', competencia)

  if (company_id) {
    expQ = expQ.eq('company_id', company_id)
    revQ = revQ.eq('company_id', company_id)
  }

  const [{ data: expenses }, { data: revenues }] = await Promise.all([expQ, revQ])

  const totalRevenue = revenues?.reduce((s, r) => s + (r.net_value ?? 0), 0) ?? 0
  const totalExpense = expenses?.reduce((s, e) => s + (e.total ?? 0), 0) ?? 0

  const byAccount: Record<string, number> = {}
  for (const e of expenses ?? []) {
    const acct = (e as unknown as { total: number | null; chart_of_accounts: { account: string; category: string } | null }).chart_of_accounts?.account ?? 'SEM CONTA'
    byAccount[acct] = (byAccount[acct] ?? 0) + (e.total ?? 0)
  }

  return { totalRevenue, totalExpense, balance: totalRevenue - totalExpense, byAccount }
}
