'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveContaAction, deleteContaAction } from '@/app/(app)/cadastros/actions'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['chart_of_accounts']['Row']
type Category = Account['category']

const CATEGORIES: Category[] = [
  'RECEITA', 'DESPESA', 'DESPESAS BANCÁRIAS', 'DESPESAS FIXAS',
  'ENCARGOS', 'FOLHA DE PAGAMENTO', 'SERVIÇOS DE TERCEIROS', 'TRIBUTOS'
]

type EditingAccount = { id?: string; code?: string; account?: string; sub_account?: string; description?: string; category?: Category }
const empty: EditingAccount = { code: '', account: '', sub_account: '', description: '' }

export function ContasTable({ accounts }: { accounts: Account[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EditingAccount>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(empty); setOpen(true) }
  function openEdit(a: Account) { setEditing({ id: a.id, code: a.code, account: a.account, sub_account: a.sub_account ?? undefined, description: a.description, category: a.category }); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveContaAction({
      id: editing.id,
      code: editing.code!,
      account: editing.account!,
      sub_account: editing.sub_account ?? undefined,
      description: editing.description!,
      category: editing.category!,
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta conta?')) return
    await deleteContaAction(id)
    router.refresh()
  }

  function txt(k: keyof EditingAccount, label: string) {
    return (
      <div>
        <Label>{label}</Label>
        <Input
          value={(editing as Record<string, unknown>)[k] as string ?? ''}
          onChange={e => setEditing(prev => ({ ...prev, [k]: e.target.value }))}
        />
      </div>
    )
  }

  const valid = editing.code && editing.account && editing.description && editing.category

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Plano de Contas</h1>
          <Button onClick={openNew}>+ Nova Conta</Button>
        </div>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Conta</th>
                <th className="p-3 text-left">Subconta</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-mono text-xs">{a.code}</td>
                  <td className="p-3">{a.account}</td>
                  <td className="p-3 text-xs text-slate-500">{a.sub_account ?? '—'}</td>
                  <td className="p-3">{a.description}</td>
                  <td className="p-3">
                    <Badge variant={a.category === 'RECEITA' ? 'default' : 'secondary'}>
                      {a.category}
                    </Badge>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {txt('code', 'Código *')}
              {txt('account', 'Conta *')}
              {txt('sub_account', 'Subconta')}
              {txt('description', 'Descrição *')}
            </div>
            <div>
              <Label>Categoria *</Label>
              <select
                value={editing.category ?? ''}
                onChange={e => setEditing(prev => ({ ...prev, category: e.target.value as Category || undefined }))}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">— Selecione —</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || !valid}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
