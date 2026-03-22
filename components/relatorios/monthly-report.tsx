'use client'
import { formatBRL } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ReportData {
  totalRevenue: number
  totalExpense: number
  balance: number
  byAccount: Record<string, number>
}

interface Transaction {
  competencia: string
  description?: string | null
  due_date?: string | null
  total?: number | null
  status?: string | null
  companies?: { name: string } | null
  suppliers?: { name: string } | null
}

interface MonthlyReportProps {
  report: ReportData
  transactions: Transaction[]
  competencia: string
}

function exportCSV(transactions: Transaction[], competencia: string) {
  const headers = ['Competência', 'Empresa', 'Descrição', 'Fornecedor', 'Vencimento', 'Total', 'Status']
  const rows = transactions.map(t => [
    t.competencia,
    t.companies?.name ?? '',
    t.description ?? '',
    t.suppliers?.name ?? '',
    t.due_date ?? '',
    t.total?.toFixed(2) ?? '0.00',
    t.status ?? '',
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lancamentos-${competencia}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function MonthlyReport({ report, transactions, competencia }: MonthlyReportProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-slate-500 mb-1">RECEITA TOTAL</div>
            <div className="text-2xl font-bold text-green-600">{formatBRL(report.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-slate-500 mb-1">DESPESA TOTAL</div>
            <div className="text-2xl font-bold text-red-500">{formatBRL(report.totalExpense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-slate-500 mb-1">SALDO</div>
            <div className={`text-2xl font-bold ${report.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {formatBRL(report.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Despesas por conta</h3>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Conta</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(report.byAccount)
                .sort(([, a], [, b]) => b - a)
                .map(([account, total]) => (
                  <tr key={account} className="border-t">
                    <td className="p-3">{account}</td>
                    <td className="p-3 text-right font-medium">{formatBRL(total)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button variant="outline" onClick={() => exportCSV(transactions, competencia)}>
        Exportar CSV
      </Button>
    </div>
  )
}
