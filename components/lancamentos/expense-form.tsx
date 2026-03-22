'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { expenseSchema, type ExpenseFormData } from '@/schemas/expense'
import { saveExpenseTransaction } from '@/app/(app)/lancamentos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currentCompetencia } from '@/lib/utils/date'
import { useState } from 'react'

interface Account { id: string; code: string; description: string; category: string }
interface Company { id: string; name: string }
interface Client { id: string; name: string }
interface Supplier { id: string; name: string }

interface ExpenseFormProps {
  onSuccess: () => void
  companies: Company[]
  clients: Client[]
  suppliers: Supplier[]
  accounts: Account[]
  initialData?: Partial<ExpenseFormData> & { id?: string }
}

export function ExpenseForm({ onSuccess, companies, clients, suppliers, accounts, initialData }: ExpenseFormProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      competencia: currentCompetencia(),
      status: 'A PAGAR',
      principal: 0,
      fine: 0,
      interest: 0,
      ...initialData,
    },
  })

  const principal = watch('principal') || 0
  const fine = watch('fine') || 0
  const interest = watch('interest') || 0
  const total = Number(principal) + Number(fine) + Number(interest)

  async function onSubmit(data: ExpenseFormData) {
    setLoading(true)
    setError('')
    try {
      await saveExpenseTransaction({ ...data, id: initialData?.id })
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  // Group accounts by category for the select
  const accountsByCategory: Record<string, Account[]> = {}
  for (const acc of accounts) {
    if (!accountsByCategory[acc.category]) accountsByCategory[acc.category] = []
    accountsByCategory[acc.category].push(acc)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="competencia">Competência</Label>
          <Input id="competencia" {...register('competencia')} placeholder="2026-03" />
          {errors.competencia && <p className="text-xs text-red-500">{errors.competencia.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Status</Label>
          <select id="status" {...register('status')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="A PAGAR">A PAGAR</option>
            <option value="PAGO">PAGO</option>
            <option value="A VERIFICAR">A VERIFICAR</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="company_id">Empresa</Label>
        <select id="company_id" {...register('company_id')} className="w-full border rounded-md px-3 py-2 text-sm">
          <option value="">Selecione...</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {errors.company_id && <p className="text-xs text-red-500">{errors.company_id.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="account_id">Conta</Label>
        <select id="account_id" {...register('account_id')} className="w-full border rounded-md px-3 py-2 text-sm">
          <option value="">Selecione...</option>
          {Object.entries(accountsByCategory).map(([cat, accs]) => (
            <optgroup key={cat} label={cat}>
              {accs.map(a => <option key={a.id} value={a.id}>{a.code} — {a.description}</option>)}
            </optgroup>
          ))}
        </select>
        {errors.account_id && <p className="text-xs text-red-500">{errors.account_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="client_id">Cliente</Label>
          <select id="client_id" {...register('client_id')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Nenhum</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="supplier_id">Fornecedor</Label>
          <select id="supplier_id" {...register('supplier_id')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Nenhum</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="doc_type">Tipo Doc.</Label>
          <Input id="doc_type" {...register('doc_type')} placeholder="NF, Boleto..." />
        </div>
        <div className="space-y-1">
          <Label htmlFor="doc_number">Nº Doc.</Label>
          <Input id="doc_number" {...register('doc_number')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register('description')} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="issue_date">Emissão</Label>
          <Input id="issue_date" type="date" {...register('issue_date')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="due_date">Vencimento</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="payment_date">Pagamento</Label>
          <Input id="payment_date" type="date" {...register('payment_date')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="principal">Principal</Label>
          <Input id="principal" type="number" step="0.01" {...register('principal')} />
          {errors.principal && <p className="text-xs text-red-500">{errors.principal.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="fine">Multa</Label>
          <Input id="fine" type="number" step="0.01" {...register('fine')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="interest">Juros</Label>
          <Input id="interest" type="number" step="0.01" {...register('interest')} />
        </div>
      </div>

      <div className="bg-slate-50 rounded-md p-3 text-sm flex justify-between">
        <span className="font-semibold">Total</span>
        <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : initialData?.id ? 'Atualizar' : 'Salvar'}
      </Button>
    </form>
  )
}
