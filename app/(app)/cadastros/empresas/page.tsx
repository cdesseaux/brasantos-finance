import { getCompanies } from '@/lib/db/companies'

export default async function EmpresasPage() {
  const companies = await getCompanies()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Empresas</h1>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">CNPJ</th>
              <th className="p-3 text-left">Endereço</th>
              <th className="p-3 text-left">CEP</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-semibold">{c.name}</td>
                <td className="p-3 font-mono text-xs">{c.cnpj ?? '—'}</td>
                <td className="p-3">{c.address ?? '—'}</td>
                <td className="p-3 font-mono text-xs">{c.cep ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
