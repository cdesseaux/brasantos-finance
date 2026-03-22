import { getMonthlySummaryByCompany } from '@/lib/db/analytics'
import { getDueExpenses } from '@/lib/db/expense-transactions'
import { getDueRevenues } from '@/lib/db/revenue-transactions'
import { CompanyCard } from '@/components/dashboard/company-card'
import { DueAlerts } from '@/components/dashboard/due-alerts'
import { formatBRL } from '@/lib/utils/currency'
import { currentCompetencia, formatCompetencia } from '@/lib/utils/date'

export default async function DashboardPage({
  searchParams
}: { searchParams: Promise<{ comp?: string }> }) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()

  const [summaries, dueExpenses, dueRevenues] = await Promise.all([
    getMonthlySummaryByCompany(comp),
    getDueExpenses(7),
    getDueRevenues(7),
  ])

  const totals = summaries.reduce(
    (acc, s) => ({
      revenue: acc.revenue + s.revenue,
      expense: acc.expense + s.expense,
      balance: acc.balance + s.balance,
    }),
    { revenue: 0, expense: 0, balance: 0 }
  )

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard — {formatCompetencia(comp)}</h1>

      <DueAlerts expenses={dueExpenses ?? []} revenues={dueRevenues ?? []} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaries.map(s => (
          <CompanyCard key={s.company_id} {...s} />
        ))}
      </div>

      {/* Holding total */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <span className="font-bold">HOLDING — Total {formatCompetencia(comp)}</span>
        <div className="flex gap-6 text-sm">
          <span className="text-green-600 font-semibold">Receita: {formatBRL(totals.revenue)}</span>
          <span className="text-red-500 font-semibold">Despesa: {formatBRL(totals.expense)}</span>
          <span className={`font-bold ${totals.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            Saldo: {formatBRL(totals.balance)}
          </span>
        </div>
      </div>
    </div>
  )
}
