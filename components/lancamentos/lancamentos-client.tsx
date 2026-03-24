'use client'
import { useMemo, useState } from 'react'
import { TransactionList, type Transaction } from './transaction-list'
import { TransactionDrawer } from './transaction-drawer'
import { deleteExpenseTransactionAction, deleteRevenueTransactionAction } from '@/app/(app)/lancamentos/actions'
import { PeriodSelect } from '@/components/relatorios/period-select'
import { applyLancamentosFilters, type LancamentosFilters } from '@/lib/utils/lancamentos-filters'

interface Props {
  transactions: Transaction[]
  companies: { id: string; name: string }[]
  clients: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  accounts: { id: string; code: string; description: string; category: string }[]
  competencia: string
  competenciaDisplay: string
}

const EMPTY_FILTERS: LancamentosFilters = { empresa: '', tipo: '', fornecedor: '', cliente: '', conta: '', status: '' }
const TIPO_LABELS: Record<string, string> = { expense: 'Despesa', revenue: 'Receita' }

export function LancamentosClient({ transactions, companies, clients, suppliers, accounts, competencia, competenciaDisplay }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [filters, setFilters] = useState<LancamentosFilters>(EMPTY_FILTERS)

  function handleEdit(t: Transaction) {
    setEditTarget(t)
    setDrawerOpen(true)
  }

  async function handleDelete(id: string, type: 'expense' | 'revenue') {
    if (!confirm('Confirmar exclusão?')) return
    if (type === 'expense') {
      await deleteExpenseTransactionAction(id)
    } else {
      await deleteRevenueTransactionAction(id)
    }
  }

  function setFilter(key: keyof LancamentosFilters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function clearAll() {
    setFilters(EMPTY_FILTERS)
  }

  const filteredTransactions = useMemo(
    () => applyLancamentosFilters(transactions, filters),
    [transactions, filters],
  )

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const empresaOptions = [...new Set(transactions.map(t => t.companies?.name).filter(Boolean))] as string[]
  const fornecedorOptions = [...new Set(transactions.map(t => t.suppliers?.name).filter(Boolean))] as string[]
  const clienteOptions = [...new Set(transactions.map(t => t.clients?.name).filter(Boolean))] as string[]
  const contaOptions = [...new Set(
    transactions
      .map(t => t.chart_of_accounts?.code
        ? `${t.chart_of_accounts.code} — ${t.chart_of_accounts.description}`
        : null)
      .filter(Boolean)
  )] as string[]
  const statusOptions = [...new Set(transactions.map(t => t.status).filter(Boolean))] as string[]

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Lançamentos — {competenciaDisplay}</h1>
        <div className="flex items-center gap-2">
          <PeriodSelect value={competencia} />
          <button onClick={() => { setEditTarget(null); setDrawerOpen(true) }}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
            + Novo
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap mb-2">
        {empresaOptions.length > 0 && (
          <select
            value={filters.empresa}
            onChange={e => setFilter('empresa', e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Empresa</option>
            {empresaOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        <select
          value={filters.tipo}
          onChange={e => setFilter('tipo', e.target.value)}
          className="border rounded-md px-2 py-1 text-sm"
        >
          <option value="">Tipo</option>
          <option value="expense">Despesa</option>
          <option value="revenue">Receita</option>
        </select>
        {fornecedorOptions.length > 0 && (
          <select
            value={filters.fornecedor}
            onChange={e => setFilter('fornecedor', e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Fornecedor</option>
            {fornecedorOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {clienteOptions.length > 0 && (
          <select
            value={filters.cliente}
            onChange={e => setFilter('cliente', e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Cliente</option>
            {clienteOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {contaOptions.length > 0 && (
          <select
            value={filters.conta}
            onChange={e => setFilter('conta', e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Conta</option>
            {contaOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {statusOptions.length > 0 && (
          <select
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="">Status</option>
            {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
      </div>

      {/* Active chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap items-center mb-4">
          {filters.empresa && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Empresa: {filters.empresa}
              <button onClick={() => setFilter('empresa', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.tipo && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Tipo: {TIPO_LABELS[filters.tipo]}
              <button onClick={() => setFilter('tipo', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.fornecedor && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Fornecedor: {filters.fornecedor}
              <button onClick={() => setFilter('fornecedor', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.cliente && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Cliente: {filters.cliente}
              <button onClick={() => setFilter('cliente', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.conta && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Conta: {filters.conta}
              <button onClick={() => setFilter('conta', '')} className="ml-1">✕</button>
            </span>
          )}
          {filters.status && (
            <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
              Status: {filters.status}
              <button onClick={() => setFilter('status', '')} className="ml-1">✕</button>
            </span>
          )}
          <button onClick={clearAll} className="text-slate-400 text-xs underline">Limpar tudo</button>
          <span className="text-slate-400 text-xs">— {filteredTransactions.length} de {transactions.length} lançamentos</span>
        </div>
      )}

      <TransactionList
        transactions={filteredTransactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        activeFilters={hasActiveFilters}
        onClearFilters={clearAll}
      />

      <TransactionDrawer
        companies={companies}
        clients={clients}
        suppliers={suppliers}
        accounts={accounts}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        initialData={editTarget ? {
          type: editTarget.type,
          data: editTarget as unknown as Record<string, unknown> & { id?: string },
        } : undefined}
      />
    </div>
  )
}
