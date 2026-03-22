import { getClientCrossTable } from '@/lib/db/analytics'
import { formatBRL } from '@/lib/utils/currency'

interface Props { year: number }

export async function ClientCrossTable({ year }: Props) {
  const table = await getClientCrossTable(year)
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  )
  const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const clients = Object.entries(table)

  if (clients.length === 0) {
    return <div className="mt-4 text-sm text-slate-500 py-8 text-center">Sem dados para {year}.</div>
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2 text-left border border-slate-200 sticky left-0 bg-slate-50 min-w-[140px]">
              Cliente
            </th>
            {monthLabels.map((m, i) => (
              <th key={i} className="p-2 text-right border border-slate-200 min-w-[80px]">{m}</th>
            ))}
            <th className="p-2 text-right border border-slate-200 min-w-[90px] font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(([clientId, { name, months: mData }]) => {
            const annual = Object.values(mData).reduce((s, v) => s + v, 0)
            return (
              <tr key={clientId} className="hover:bg-slate-50">
                <td className="p-2 border border-slate-200 font-medium sticky left-0 bg-white">{name}</td>
                {months.map((m, i) => {
                  const v = mData[m]
                  return (
                    <td key={i}
                      className={`p-2 text-right border border-slate-200 ${v == null ? 'text-slate-300' : v < 0 ? 'text-red-500' : 'text-slate-700'}`}>
                      {v != null ? formatBRL(v) : '—'}
                    </td>
                  )
                })}
                <td className={`p-2 text-right border border-slate-200 font-bold ${annual < 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {formatBRL(annual)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
