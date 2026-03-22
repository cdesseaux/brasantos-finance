'use client'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { revenueSchema, type RevenueFormData } from '@/schemas/revenue'
import { saveRevenueTransaction } from '@/app/(app)/lancamentos/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currentCompetencia } from '@/lib/utils/date'
import { useState } from 'react'

interface Company { id: string; name: string }
interface Client { id: string; name: string }
interface Account { id: string; code: string; description: string }

interface RevenueFormProps {
  onSuccess: () => void
  companies: Company[]
  clients: Client[]
  accounts: Account[]
  initialData?: Partial<RevenueFormData> & { id?: string }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-700 border-b pb-1 mt-4 mb-2">{children}</h3>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NumField({ label, name, register }: { label: string; name: string; register: any }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">{label}</Label>
      <Input id={name} type="number" step="0.01" className="h-8 text-sm" {...register(name)} />
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RevenueForm({ onSuccess, companies, clients, accounts: _accounts, initialData }: RevenueFormProps) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, control, formState: { errors } } = useForm<RevenueFormData>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      competencia: currentCompetencia(),
      status: 'A RECEBER',
      ...initialData,
    },
  })

  const watched = useWatch({ control })

  // Auto-calculated totals
  const gps = Number(watched.gps_2632) || 0
  const irpj = Number(watched.irpj_2089) || 0
  const csll = Number(watched.csll_2372) || 0
  const cofins = Number(watched.cofins_2172) || 0
  const pis = Number(watched.pis_8109) || 0
  const issqn = Number(watched.issqn_1732) || 0
  const totalRetention = gps + irpj + csll + cofins + pis + issqn

  const grossValue =
    (Number(watched.total_services) || 0) +
    (Number(watched.materials) || 0) +
    (Number(watched.equipment) || 0) +
    (Number(watched.vt_44_total) || 0) +
    (Number(watched.vt_12_total) || 0) +
    (Number(watched.va_44_total) || 0) +
    (Number(watched.va_12_total) || 0) +
    (Number(watched.unif_44_total) || 0) +
    (Number(watched.unif_12_total) || 0)
  const netValue = grossValue - totalRetention

  async function onSubmit(data: RevenueFormData) {
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...data,
        total_retention: totalRetention,
        net_value: netValue,
        id: initialData?.id,
      }
      await saveRevenueTransaction(payload)
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 pt-2">
      <SectionTitle>Identificação</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="competencia-r">Competência</Label>
          <Input id="competencia-r" {...register('competencia')} placeholder="2026-03" />
          {errors.competencia && <p className="text-xs text-red-500">{errors.competencia.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="nf_number">NF Nº</Label>
          <Input id="nf_number" {...register('nf_number')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="company_id-r">Empresa</Label>
          <select id="company_id-r" {...register('company_id')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Selecione...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.company_id && <p className="text-xs text-red-500">{errors.company_id.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="client_id">Cliente</Label>
          <select id="client_id" {...register('client_id')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.client_id && <p className="text-xs text-red-500">{errors.client_id.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="status-r">Status</Label>
          <select id="status-r" {...register('status')} className="w-full border rounded-md px-3 py-2 text-sm">
            <option value="A RECEBER">A RECEBER</option>
            <option value="RECEBIDO">RECEBIDO</option>
            <option value="A VERIFICAR">A VERIFICAR</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="issue_date-r">Emissão</Label>
          <Input id="issue_date-r" type="date" {...register('issue_date')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="due_date-r">Vencimento</Label>
          <Input id="due_date-r" type="date" {...register('due_date')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="payment_date-r">Recebimento</Label>
          <Input id="payment_date-r" type="date" {...register('payment_date')} />
        </div>
      </div>

      <SectionTitle>Valores dos Serviços</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <NumField label="Serviços" name="total_services" register={register} />
        <NumField label="Materiais" name="materials" register={register} />
        <NumField label="Equipamentos" name="equipment" register={register} />
      </div>

      <SectionTitle>Vale Transporte — 44h/s</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="vt_44_qty" register={register} />
        <NumField label="Unit" name="vt_44_unit" register={register} />
        <NumField label="Dias" name="vt_44_days" register={register} />
        <NumField label="Total" name="vt_44_total" register={register} />
      </div>

      <SectionTitle>Vale Transporte — 12×36</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="vt_12_qty" register={register} />
        <NumField label="Unit" name="vt_12_unit" register={register} />
        <NumField label="Dias" name="vt_12_days" register={register} />
        <NumField label="Total" name="vt_12_total" register={register} />
      </div>

      <SectionTitle>Vale Alimentação — 44h/s</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="va_44_qty" register={register} />
        <NumField label="Unit" name="va_44_unit" register={register} />
        <NumField label="Dias" name="va_44_days" register={register} />
        <NumField label="Total" name="va_44_total" register={register} />
      </div>

      <SectionTitle>Vale Alimentação — 12×36</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="va_12_qty" register={register} />
        <NumField label="Unit" name="va_12_unit" register={register} />
        <NumField label="Dias" name="va_12_days" register={register} />
        <NumField label="Total" name="va_12_total" register={register} />
      </div>

      <SectionTitle>Uniforme — 44h/s</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="unif_44_qty" register={register} />
        <NumField label="Unit" name="unif_44_unit" register={register} />
        <NumField label="Ano" name="unif_44_year" register={register} />
        <NumField label="Total" name="unif_44_total" register={register} />
      </div>

      <SectionTitle>Uniforme — 12×36</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        <NumField label="Qtde" name="unif_12_qty" register={register} />
        <NumField label="Unit" name="unif_12_unit" register={register} />
        <NumField label="Ano" name="unif_12_year" register={register} />
        <NumField label="Total" name="unif_12_total" register={register} />
      </div>

      <SectionTitle>Retenções</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Base Retenção INSS" name="retention_base_inss" register={register} />
        <NumField label="Base Cálculo INSS" name="calc_base_inss" register={register} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumField label="GPS 2632" name="gps_2632" register={register} />
        <NumField label="IRPJ 2089" name="irpj_2089" register={register} />
        <NumField label="CSLL 2372" name="csll_2372" register={register} />
        <NumField label="COFINS 2172" name="cofins_2172" register={register} />
        <NumField label="PIS 8109" name="pis_8109" register={register} />
        <NumField label="ISSQN 1732" name="issqn_1732" register={register} />
      </div>

      <div className="bg-slate-50 rounded-md p-3 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Total Retenções</span>
          <span className="font-medium text-red-500">R$ {totalRetention.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="font-semibold">Valor Líquido</span>
          <span className="font-bold text-green-600">R$ {netValue.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Salvando...' : initialData?.id ? 'Atualizar NF' : 'Salvar NF'}
      </Button>
    </form>
  )
}
