'use client'
import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ExpenseForm } from './expense-form'
import { RevenueForm } from './revenue-form'
import type { ExpenseFormData } from '@/schemas/expense'
import type { RevenueFormData } from '@/schemas/revenue'

interface DrawerProps {
  companies: { id: string; name: string }[]
  clients: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  accounts: { id: string; code: string; description: string; category: string }[]
  initialData?: {
    type: 'expense' | 'revenue'
    data: Record<string, unknown> & { id?: string }
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionDrawer({
  companies, clients, suppliers, accounts,
  initialData, open: externalOpen, onOpenChange
}: DrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'revenue'>(initialData?.type ?? 'expense')

  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  return (
    <>
      {!isControlled && (
        <button onClick={() => setOpen(true)}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
          + Novo
        </button>
      )}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>{initialData ? 'Editar Lançamento' : 'Novo Lançamento'}</DrawerTitle>
            {!initialData && (
              <div className="flex border rounded-md overflow-hidden mt-2">
                <button type="button" onClick={() => setType('expense')}
                  className={`flex-1 py-2 text-sm font-medium ${type === 'expense' ? 'bg-blue-600 text-white' : 'hover:bg-slate-50'}`}>
                  Despesa
                </button>
                <button type="button" onClick={() => setType('revenue')}
                  className={`flex-1 py-2 text-sm font-medium ${type === 'revenue' ? 'bg-green-600 text-white' : 'hover:bg-slate-50'}`}>
                  Receita (NF)
                </button>
              </div>
            )}
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            {type === 'expense' ? (
              <ExpenseForm
                onSuccess={() => setOpen(false)}
                companies={companies}
                clients={clients}
                suppliers={suppliers}
                accounts={accounts}
                initialData={initialData?.type === 'expense' ? (initialData.data as Partial<ExpenseFormData> & { id?: string }) : undefined}
              />
            ) : (
              <RevenueForm
                onSuccess={() => setOpen(false)}
                companies={companies}
                clients={clients}
                accounts={accounts}
                initialData={initialData?.type === 'revenue' ? (initialData.data as Partial<RevenueFormData> & { id?: string }) : undefined}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
