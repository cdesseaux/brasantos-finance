'use client'
import { formatBRL } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

const statusVariant = {
  'PAGO': 'default',
  'A PAGAR': 'secondary',
  'A VERIFICAR': 'outline',
  'RECEBIDO': 'default',
  'A RECEBER': 'secondary',
} as const

type StatusKey = keyof typeof statusVariant

export interface Transaction {
  id: string
  description?: string | null
  due_date?: string | null
  status: string
  total?: number | null
  net_value?: number | null
  type: 'expense' | 'revenue'
  companies?: { name: string } | null
  clients?: { name: string } | null
  suppliers?: { name: string } | null
  chart_of_accounts?: { code?: string; description: string; category?: string } | null
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
  onDelete?: (id: string, type: 'expense' | 'revenue') => void
  activeFilters?: boolean
  onClearFilters?: () => void
}

export function TransactionList({ transactions, onEdit, onDelete, activeFilters, onClearFilters }: TransactionListProps) {
  if (transactions.length === 0) {
    if (activeFilters) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Nenhum lançamento encontrado para os filtros selecionados.</p>
          {onClearFilters && (
            <button onClick={onClearFilters} className="text-blue-600 text-sm mt-2 underline">
              Limpar filtros
            </button>
          )}
        </div>
      )
    }
    return <p className="text-slate-500 text-sm py-8 text-center">Nenhum lançamento encontrado.</p>
  }

  return (
    <div className="rounded-md border">
      {/* Desktop table */}
      <table className="w-full text-sm hidden md:table">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3 text-left">Tipo</th>
            <th className="p-3 text-left">Empresa</th>
            <th className="p-3 text-left">Descrição</th>
            <th className="p-3 text-left">Fornecedor</th>
            <th className="p-3 text-left">Cliente</th>
            <th className="p-3 text-left">Venc.</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => {
            const amount = t.type === 'revenue' ? (t.net_value ?? 0) : (t.total ?? 0)
            return (
              <tr key={t.id} className="border-t hover:bg-slate-50">
                <td className="p-3">
                  <Badge variant={t.type === 'revenue' ? 'default' : 'secondary'} className="text-xs">
                    {t.type === 'revenue' ? 'NF' : 'Desp'}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-slate-500">{t.companies?.name}</td>
                <td className="p-3">{t.description}</td>
                <td className="p-3 text-xs text-slate-500">{t.suppliers?.name}</td>
                <td className="p-3 text-xs text-slate-500">{t.clients?.name}</td>
                <td className="p-3 text-xs">{formatDate(t.due_date)}</td>
                <td className={`p-3 text-right font-medium ${t.type === 'revenue' ? 'text-green-600' : ''}`}>
                  {formatBRL(amount)}
                </td>
                <td className="p-3">
                  <Badge variant={statusVariant[t.status as StatusKey] ?? 'outline'}>
                    {t.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(t.id, t.type)}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {transactions.map(t => {
          const amount = t.type === 'revenue' ? (t.net_value ?? 0) : (t.total ?? 0)
          return (
            <div key={t.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.companies?.name}
                    {t.suppliers?.name && ` · ${t.suppliers.name}`}
                    {t.clients?.name && ` · ${t.clients.name}`}
                  </p>
                  <p className="text-xs text-slate-400">{formatDate(t.due_date)}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className={`font-semibold text-sm ${t.type === 'revenue' ? 'text-green-600' : ''}`}>
                    {formatBRL(amount)}
                  </p>
                  <Badge className="text-xs" variant={statusVariant[t.status as StatusKey] ?? 'outline'}>
                    {t.status}
                  </Badge>
                  <div className="flex gap-1 mt-1">
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(t)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" onClick={() => onDelete(t.id, t.type)}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
