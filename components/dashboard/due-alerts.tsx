import { formatBRL } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface DueItem {
  id: string
  description?: string | null
  companies: { name: string } | null
  due_date: string
  total?: number | null
  net_value?: number | null
}

export function DueAlerts({ expenses, revenues }: { expenses: DueItem[]; revenues: DueItem[] }) {
  const items = [
    ...expenses.map(e => ({ ...e, type: 'despesa', amount: e.total ?? 0 })),
    ...revenues.map(r => ({ ...r, description: r.description ?? `NF`, type: 'receita', amount: r.net_value ?? 0 })),
  ].sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? ''))

  if (items.length === 0) return null

  return (
    <Alert className="border-yellow-300 bg-yellow-50 mb-6">
      <AlertTitle>⚠️ {items.length} conta(s) vencem nos próximos 7 dias</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {items.map(item => (
            <li key={item.id} className="text-sm flex justify-between">
              <span>
                {item.description} ·{' '}
                <span className="text-slate-500">{item.companies?.name}</span>
              </span>
              <span className="font-medium">
                {formatBRL(item.amount)} — {formatDate(item.due_date)}
              </span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
