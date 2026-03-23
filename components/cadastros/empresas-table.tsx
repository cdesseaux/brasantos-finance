'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveEmpresaAction, deleteEmpresaAction } from '@/app/(app)/cadastros/actions'
import type { Database } from '@/types/database'

type Company = Database['public']['Tables']['companies']['Row']

const empty = { name: '', cnpj: '', inscricao_municipal: '', address: '', cep: '' }

export function EmpresasTable({ companies }: { companies: Company[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Company>>(empty)
  const [saving, setSaving] = useState(false)

  function openNew() { setEditing(empty); setOpen(true) }
  function openEdit(c: Company) { setEditing(c); setOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveEmpresaAction({
      id: editing.id,
      name: editing.name!,
      cnpj: editing.cnpj ?? undefined,
      inscricao_municipal: editing.inscricao_municipal ?? undefined,
      address: editing.address ?? undefined,
      cep: editing.cep ?? undefined,
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta empresa?')) return
    await deleteEmpresaAction(id)
    router.refresh()
  }

  function field(k: keyof typeof empty, label: string, placeholder?: string) {
    return (
      <div>
        <Label>{label}</Label>
        <Input
          value={(editing as Record<string, string>)[k] ?? ''}
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
          <h1 className="text-2xl font-bold">Empresas</h1>
          <Button onClick={openNew}>+ Nova Empresa</Button>
        </div>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">CNPJ</th>
                <th className="p-3 text-left">Endereço</th>
                <th className="p-3 text-left">CEP</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 font-mono text-xs">{c.cnpj ?? '—'}</td>
                  <td className="p-3">{c.address ?? '—'}</td>
                  <td className="p-3 font-mono text-xs">{c.cep ?? '—'}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => openEdit(c)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-xs">Excluir</button>
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
            <DialogTitle>{editing.id ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            {field('name', 'Nome *')}
            {field('cnpj', 'CNPJ', '00.000.000/0000-00')}
            {field('inscricao_municipal', 'Inscrição Municipal')}
            {field('address', 'Endereço')}
            {field('cep', 'CEP', '00000-000')}
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
