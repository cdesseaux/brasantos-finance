import { getChartOfAccounts } from '@/lib/db/chart-of-accounts'
import { Badge } from '@/components/ui/badge'

export default async function PlanoDeContasPage() {
  const accounts = await getChartOfAccounts()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plano de Contas</h1>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Conta</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{acc.code}</td>
                <td className="p-3">{acc.account}</td>
                <td className="p-3">{acc.description}</td>
                <td className="p-3">
                  <Badge variant={acc.category === 'RECEITA' ? 'default' : 'secondary'}>
                    {acc.category}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
