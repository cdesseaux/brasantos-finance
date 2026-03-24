export interface LancamentosFilters {
  empresa: string
  tipo: string
  fornecedor: string
  cliente: string
  conta: string
  status: string
}

interface FilterableTransaction {
  id: string
  type: 'expense' | 'revenue'
  status: string
  companies?: { name: string } | null
  suppliers?: { name: string } | null
  clients?: { name: string } | null
  chart_of_accounts?: { code?: string; description: string; category?: string } | null
}

export function applyLancamentosFilters<T extends FilterableTransaction>(
  transactions: T[],
  filters: LancamentosFilters,
): T[] {
  return transactions.filter(t => {
    if (filters.empresa && t.companies?.name !== filters.empresa) return false
    if (filters.tipo && t.type !== filters.tipo) return false
    if (filters.fornecedor && t.suppliers?.name !== filters.fornecedor) return false
    if (filters.cliente && t.clients?.name !== filters.cliente) return false
    if (filters.conta) {
      const label = t.chart_of_accounts?.code
        ? `${t.chart_of_accounts.code} — ${t.chart_of_accounts.description}`
        : null
      if (label !== filters.conta) return false
    }
    if (filters.status && t.status !== filters.status) return false
    return true
  })
}
