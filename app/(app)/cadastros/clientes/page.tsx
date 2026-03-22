import { getClients } from '@/lib/db/clients'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'

export default async function ClientesPage() {
  const clients = await getClients()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Segmento</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">CNPJ</th>
              <th className="p-3 text-left">Início</th>
              <th className="p-3 text-left">Fim</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{c.item ?? '—'}</td>
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3">
                  {c.segment && (
                    <Badge variant="outline">{c.segment}</Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={c.status === 'ATIVO' ? 'default' : 'secondary'}>
                    {c.status ?? 'ATIVO'}
                  </Badge>
                </td>
                <td className="p-3 text-xs">
                  {(c.companies as { name: string } | null)?.name ?? '—'}
                </td>
                <td className="p-3 font-mono text-xs">{c.cnpj ?? '—'}</td>
                <td className="p-3 text-xs">{formatDate(c.contract_start)}</td>
                <td className="p-3 text-xs">{formatDate(c.contract_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
