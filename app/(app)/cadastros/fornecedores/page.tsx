import { getSuppliers } from '@/lib/db/suppliers'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/date'

export default async function FornecedoresPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Item</th>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Empresa</th>
              <th className="p-3 text-left">CNPJ</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Início</th>
              <th className="p-3 text-left">Fim</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{s.item ?? '—'}</td>
                <td className="p-3 font-semibold">{s.name}</td>
                <td className="p-3 text-xs">
                  {(s.companies as { name: string } | null)?.name ?? '—'}
                </td>
                <td className="p-3 font-mono text-xs">{s.cnpj ?? '—'}</td>
                <td className="p-3">
                  <Badge variant={s.status === 'ATIVO' ? 'default' : 'secondary'}>
                    {s.status ?? 'ATIVO'}
                  </Badge>
                </td>
                <td className="p-3 text-xs">{formatDate(s.contract_start)}</td>
                <td className="p-3 text-xs">{formatDate(s.contract_end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
