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

  // Overhead = expenses linked to ADM/OPERACIONAL clients (by name or segment) or null client_id
  function clientInfo(raw: unknown): { name: string; segment: string } | null {
    const c = raw as { clients?: { name: string; segment: string } | { name: string; segment: string }[] | null }
    const clients = c.clients
    if (!clients) return null
    return Array.isArray(clients) ? (clients[0] ?? null) : clients
  }

  function isIndirect(e: { client_id: unknown }): boolean {
    if (!e.client_id) return true
    const info = clientInfo(e)
    const name = (info?.name ?? '').trim().toUpperCase()
    const seg = (info?.segment ?? '').trim().toUpperCase()
    return ['ADM', 'OPERACIONAL'].includes(seg) ||
      name === 'ADM' || name === 'OPERACIONAL' ||
      name.startsWith('ADM') || name.startsWith('OPERACIONAL')
  }

  const overhead = expenses
    ?.filter(e => isIndirect(e))
    .reduce((s, e) => s + (e.total ?? 0), 0) ?? 0

  const clientRevenue: Record<string, number> = {}
  const clientDirectExpense: Record<string, number> = {}

  function isExcludedClient(row: { client_id: unknown }): boolean {
    if (!row.client_id) return true
    const info = clientInfo(row)
    const name = (info?.name ?? '').trim().toUpperCase()
    const seg = (info?.segment ?? '').trim().toUpperCase()
    return ['ADM', 'OPERACIONAL', 'BANCO'].includes(seg) ||
      name === 'ADM' || name === 'OPERACIONAL' || name === 'BANCO' ||
      name.startsWith('ADM') || name.startsWith('OPERACIONAL')
  }

  for (const r of revenues ?? []) {
    if (isExcludedClient(r)) continue
    clientRevenue[r.client_id!] = (clientRevenue[r.client_id!] ?? 0) + (r.net_value ?? 0)
  }
  for (const e of expenses ?? []) {
    if (isExcludedClient(e)) continue
    clientDirectExpense[e.client_id!] = (clientDirectExpense[e.client_id!] ?? 0) + (e.total ?? 0)
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
