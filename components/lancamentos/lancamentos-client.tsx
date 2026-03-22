'use client'
import { useState } from 'react'
import { TransactionList, type Transaction } from './transaction-list'
import { TransactionDrawer } from './transaction-drawer'
import { deleteExpenseTransactionAction, deleteRevenueTransactionAction } from '@/app/(app)/lancamentos/actions'

interface Props {
  transactions: (Transaction & { [key: string]: unknown })[]
  companies: { id: string; name: string }[]
  clients: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  accounts: { id: string; code: string; description: string; category: string }[]
  competencia: string
  competenciaDisplay: string
}

export function LancamentosClient({ transactions, companies, clients, suppliers, accounts, competencia, competenciaDisplay }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<(Transaction & { [key: string]: unknown }) | null>(null)

  function handleEdit(t: Transaction) {
    setEditTarget(t as Transaction & { [key: string]: unknown })
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

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Lançamentos — {competenciaDisplay}</h1>
        <button onClick={() => { setEditTarget(null); setDrawerOpen(true) }}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
          + Novo
        </button>
      </div>
      <div className="text-sm text-slate-500 mb-4">Competência: {competencia}</div>

      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
          data: editTarget,
        } : undefined}
      />
    </div>
  )
}
