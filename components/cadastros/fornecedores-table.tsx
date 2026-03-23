'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveFornecedorAction, deleteFornecedorAction } from '@/app/(app)/cadastros/actions'
import { formatDate } from '@/lib/utils/date'
import type { Database } from '@/types/database'

type Supplier = Database['public']['Tables']['suppliers']['Row'] & {
  companies: { name: string } | null
}
type Company = Database['public']['Tables']['companies']['Row']

const empty: Partial<Supplier> = { name: '', status: 'ATIVO', cnpj: '', company_id: '' }

export function FornecedoresTable({ suppliers, companies }: { suppliers: Supplier[], companies: Company[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Supplier>>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(empty); setOpen(true) }
  function openEdit(s: Supplier) { setEditing(s); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveFornecedorAction({
      id: editing.id,
      name: editing.name!,
      company_id: editing.company_id ?? undefined,
      cnpj: editing.cnpj ?? undefined,
      razao_social: editing.razao_social ?? undefined,
      city: editing.city ?? undefined,
      address: editing.address ?? undefined,
      cep: editing.cep ?? undefined,
      tel: editing.tel ?? undefined,
      contract_no: editing.contract_no ?? undefined,
      contract_start: editing.contract_start ?? undefined,
      contract_end: editing.contract_end ?? undefined,
      status: editing.status ?? 'ATIVO',
      value: editing.value ?? undefined,
      object: editing.object ?? undefined,
      due_day: editing.due_day ?? undefined,
      item: editing.item ?? undefined,
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este fornecedor?')) return
    await deleteFornecedorAction(id)
    router.refresh()
  }

  function txt(k: keyof Supplier, label: string, placeholder?: string) {
    return (
      <div>
        <Label>{label}</Label>
        <Input
          value={(editing as Record<string, unknown>)[k] as string ?? ''}
          placeholder={placeholder}
          onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))}
        />
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <Button onClick={openNew}>+ Novo Fornecedor</Button>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Empresa</th>
                <th className="p-3 text-left">CNPJ</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Início</th>
                <th className="p-3 text-left">Fim</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-semibold">{s.name}</td>
                  <td className="p-3 text-xs">{s.companies?.name ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{s.cnpj ?? '—'}</td>
                  <td className="p-3">
                    <Badge variant={s.status === 'ATIVO' ? 'default' : 'secondary'}>{s.status ?? 'ATIVO'}</Badge>
                  </td>
                  <td className="p-3 text-xs">{formatDate(s.contract_start)}</td>
                  <td className="p-3 text-xs">{formatDate(s.contract_end)}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {txt('name', 'Nome *')}
              <div>
                <Label>Empresa</Label>
                <select
                  value={editing.company_id ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, company_id: e.target.value || undefined }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="">— Selecione —</option>
                  {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                </select>
              </div>
              {txt('cnpj', 'CNPJ', '00.000.000/0000-00')}
              {txt('razao_social', 'Razão Social')}
              <div>
                <Label>Status</Label>
                <select
                  value={editing.status ?? 'ATIVO'}
                  onChange={e => setEditing(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option>ATIVO</option>
                  <option>INATIVO</option>
                </select>
              </div>
              <div>
                <Label>Valor do Contrato</Label>
                <Input
                  type="number" step="0.01"
                  value={editing.value ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, value: parseFloat(e.target.value) || undefined }))}
                />
              </div>
              {txt('contract_no', 'Nº Contrato')}
              <div>
                <Label>Dia de Vencimento</Label>
                <Input
                  type="number" min="1" max="31"
                  value={editing.due_day ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, due_day: parseInt(e.target.value) || undefined }))}
                />
              </div>
              <div>
                <Label>Início do Contrato</Label>
                <Input type="date" value={editing.contract_start ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, contract_start: e.target.value || undefined }))} />
              </div>
              <div>
                <Label>Fim do Contrato</Label>
                <Input type="date" value={editing.contract_end ?? ''}
                  onChange={e => setEditing(prev => ({ ...prev, contract_end: e.target.value || undefined }))} />
              </div>
              {txt('tel', 'Telefone')}
              {txt('city', 'Cidade')}
              {txt('address', 'Endereço')}
              {txt('cep', 'CEP')}
            </div>
            <div>
              <Label>Objeto / Descrição</Label>
              <Input value={editing.object ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, object: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || !editing.name}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
