import { getMonthlyReport } from '@/lib/db/analytics'
import { getExpenseTransactions } from '@/lib/db/expense-transactions'
import { getCompanies } from '@/lib/db/companies'
import { MonthlyReport } from '@/components/relatorios/monthly-report'
import { RevenueExpenseChart } from '@/components/relatorios/revenue-expense-chart'
import { currentCompetencia, formatCompetencia, lastNMonths } from '@/lib/utils/date'

export default async function RelatoriosPage({
  searchParams
}: { searchParams: Promise<{ comp?: string; company?: string }> }) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()

  const last6 = lastNMonths(6).reverse() // oldest first for chart

  const [report, transactions, companies, chartData] = await Promise.all([
    getMonthlyReport(comp, params.company),
    getExpenseTransactions({ competencia: comp, company_id: params.company }),
    getCompanies(),
    Promise.all(last6.map(async m => {
      const r = await getMonthlyReport(m, params.company)
      return { month: m, revenue: r.totalRevenue, expense: r.totalExpense }
    })),
  ])

  void companies

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Relatórios — {formatCompetencia(comp)}</h1>
        <div className="flex gap-2 text-sm">
          <select
            defaultValue={comp}
            className="border rounded-md px-2 py-1 text-sm"
            onChange={() => {}}  // URL navigation handled client-side or by native form
          >
            {lastNMonths(12).map(m => (
              <option key={m} value={m}>{formatCompetencia(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">Últimos 6 meses</h2>
        <RevenueExpenseChart data={chartData} />
      </div>

      <MonthlyReport
        report={report}
        transactions={transactions ?? []}
        competencia={comp}
      />
    </div>
  )
}
