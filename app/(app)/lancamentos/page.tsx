import { getExpenseTransactions } from '@/lib/db/expense-transactions'
import { getRevenueTransactions } from '@/lib/db/revenue-transactions'
import { getCompanies } from '@/lib/db/companies'
import { getClients } from '@/lib/db/clients'
import { getSuppliers } from '@/lib/db/suppliers'
import { getChartOfAccounts } from '@/lib/db/chart-of-accounts'
import { currentCompetencia, formatCompetencia } from '@/lib/utils/date'
import { LancamentosClient } from '@/components/lancamentos/lancamentos-client'

export default async function LancamentosPage({
  searchParams
}: {
  searchParams: Promise<{ comp?: string; company?: string; status?: string }>
}) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()

  const [expenses, revenues, companies, clients, suppliers, accounts] = await Promise.all([
    getExpenseTransactions({ competencia: comp, company_id: params.company, status: params.status }),
    getRevenueTransactions({ competencia: comp, company_id: params.company }),
    getCompanies(),
    getClients(),
    getSuppliers(),
    getChartOfAccounts(),
  ])

  // Merge and tag
  const expensesTagged = (expenses ?? []).map(e => ({ ...e, type: 'expense' as const }))
  const revenuesTagged = (revenues ?? []).map(r => ({
    ...r,
    description: `NF ${r.nf_number ?? ''}`,
    total: r.net_value,
    type: 'revenue' as const,
  }))

  const allTransactions = [...expensesTagged, ...revenuesTagged]
    .sort((a, b) => {
      const aDate = (a.due_date ?? (a as Record<string, unknown>).issue_date ?? '') as string
      const bDate = (b.due_date ?? (b as Record<string, unknown>).issue_date ?? '') as string
      return aDate.localeCompare(bDate)
    })

  return (
    <LancamentosClient
      transactions={allTransactions}
      companies={companies ?? []}
      clients={clients ?? []}
      suppliers={suppliers ?? []}
      accounts={accounts ?? []}
      competencia={comp}
      competenciaDisplay={formatCompetencia(comp)}
    />
  )
}
