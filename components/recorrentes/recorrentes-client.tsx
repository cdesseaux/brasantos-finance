'use client'
import { useState } from 'react'
import { formatBRL } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveRecurringTemplate, toggleTemplateActive, deleteRecurringTemplate, type RecurringTemplatePayload } from '@/app/(app)/recorrentes/actions'
import { currentCompetencia } from '@/lib/utils/date'
import { Pencil, Trash2, Power } from 'lucide-react'

interface Template {
  id: string
  name: string
  frequency: string
  due_day: number
  value: number
  active: boolean | null
  companies?: { name: string } | null
  suppliers?: { name: string } | null
  chart_of_accounts?: { description: string } | null
  [key: string]: unknown
}

interface Props {
  templates: Template[]
  companies: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  accounts: { id: string; code: string; description: string; category: string }[]
}

const frequencyLabel = { monthly: 'Mensal', annual: 'Anual', installments: 'Parcelado' }

export function RecorrentesClient({ templates, companies, suppliers, accounts }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<Partial<RecurringTemplatePayload>>({
    frequency: 'monthly',
    start_month: currentCompetencia(),
    active: true,
    due_day: 1,
  })

  function openNew() {
    setEditTarget(null)
    setForm({ frequency: 'monthly', start_month: currentCompetencia(), active: true, due_day: 1 })
    setDialogOpen(true)
  }

  function openEdit(t: Template) {
    setEditTarget(t)
    setForm({
      id: t.id,
      name: t.name,
      frequency: t.frequency as RecurringTemplatePayload['frequency'],
      due_day: t.due_day,
      value: t.value,
      active: t.active ?? true,
      start_month: (t.start_month as string | undefined) ?? currentCompetencia(),
      end_month: t.end_month as string | undefined,
      company_id: t.company_id as string | undefined,
      supplier_id: (t.supplier_id as string | undefined) ?? null,
      account_id: (t.account_id as string | undefined) ?? null,
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await saveRecurringTemplate(form as RecurringTemplatePayload)
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, active: boolean) {
    await toggleTemplateActive(id, !active)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir template? As despesas já geradas não serão afetadas.')) return
    await deleteRecurringTemplate(id)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Despesas Recorrentes</h1>
        <Button onClick={openNew}>+ Novo Template</Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">Freq.</th>
              <th className="p-3 text-left">Dia</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-xs text-slate-500">{t.companies?.name ?? '—'}</td>
                <td className="p-3">
                  <Badge variant="outline" className="text-xs">
                    {frequencyLabel[t.frequency as keyof typeof frequencyLabel] ?? t.frequency}
                  </Badge>
                </td>
                <td className="p-3 text-xs">dia {t.due_day}</td>
                <td className="p-3 text-right font-medium">{formatBRL(t.value)}</td>
                <td className="p-3">
                  <Badge variant={t.active ? 'default' : 'secondary'}>
                    {t.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(t.id, t.active ?? true)}>
                      <Power size={14} className={t.active ? 'text-green-500' : 'text-slate-400'} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                  Nenhum template cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Empresa</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.company_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Fornecedor</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.supplier_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value || null }))}>
                  <option value="">Nenhum</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Conta</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.account_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, account_id: e.target.value || null }))}>
                  <option value="">Nenhuma</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.description}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Frequência</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.frequency ?? 'monthly'}
                  onChange={e => setForm(f => ({ ...f, frequency: e.target.value as RecurringTemplatePayload['frequency'] }))}>
                  <option value="monthly">Mensal</option>
                  <option value="annual">Anual</option>
                  <option value="installments">Parcelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Dia Venc.</Label>
                <Input type="number" min={1} max={31}
                  value={form.due_day ?? 1}
                  onChange={e => setForm(f => ({ ...f, due_day: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input type="number" step="0.01"
                  value={form.value ?? ''}
                  onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-1">
                <Label>Início (YYYY-MM)</Label>
                <Input value={form.start_month ?? ''}
                  onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))} required />
              </div>
            </div>

            {form.frequency === 'annual' && (
              <div className="space-y-1">
                <Label>Mês de Geração (1-12)</Label>
                <Input type="number" min={1} max={12}
                  value={form.due_month ?? ''}
                  onChange={e => setForm(f => ({ ...f, due_month: Number(e.target.value) }))} />
              </div>
            )}

            {form.frequency === 'installments' && (
              <div className="space-y-1">
                <Label>Nº de Parcelas</Label>
                <Input type="number" min={1}
                  value={form.num_installments ?? ''}
                  onChange={e => setForm(f => ({ ...f, num_installments: Number(e.target.value) }))} />
              </div>
            )}

            <div className="space-y-1">
              <Label>Fim (YYYY-MM, opcional)</Label>
              <Input value={form.end_month ?? ''}
                onChange={e => setForm(f => ({ ...f, end_month: e.target.value || null }))} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Salvando...' : editTarget ? 'Atualizar' : 'Criar Template'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
