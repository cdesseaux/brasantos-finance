'use client'
import { useState } from 'react'
import { formatBRL } from '@/lib/utils/currency'
import type { ClientDREResult } from '@/lib/utils/allocation'

interface ClientDREListProps {
  results: (ClientDREResult & { name?: string })[]
  overhead: number
  clientNames: Record<string, string>
}

export function ClientDREList({ results, overhead, clientNames }: ClientDREListProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (results.length === 0) {
    return (
      <div className="mt-4 text-sm text-slate-500 py-8 text-center">
        Nenhum cliente com receita neste mês.
      </div>
    )
  }

  const sorted = [...results].sort((a, b) => b.netResult - a.netResult)

  return (
    <div className="mt-4">
      <div className="mb-3 text-xs text-slate-500">
        Overhead total: {formatBRL(overhead)} (rateado proporcionalmente)
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-right">Receita</th>
              <th className="p-3 text-right">Desp. Direta</th>
              <th className="p-3 text-right">Desp. Indireta</th>
              <th className="p-3 text-right">Resultado</th>
              <th className="p-3 text-right">Participação</th>
              <th className="p-3 text-right">Margem</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => {
              const name = clientNames[r.clientId] ?? r.clientId
              const isNeg = r.netResult < 0
              return (
                <tr
                  key={r.clientId}
                  className="border-t hover:bg-slate-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === r.clientId ? null : r.clientId)}
                >
                  <td className="p-3 font-medium">{name}</td>
                  <td className="p-3 text-right text-green-700">{formatBRL(r.revenue)}</td>
                  <td className="p-3 text-right text-red-500">{formatBRL(r.directExpenses)}</td>
                  <td className="p-3 text-right text-orange-500">{formatBRL(r.indirectExpenses)}</td>
                  <td className={`p-3 text-right font-bold ${isNeg ? 'text-red-600' : 'text-green-700'}`}>
                    {formatBRL(r.netResult)}
                    {isNeg && ' ⚠️'}
                  </td>
                  <td className="p-3 text-right text-xs text-slate-500">
                    {r.participationPct.toFixed(1)}%
                  </td>
                  <td className={`p-3 text-right font-medium ${isNeg ? 'text-red-600' : 'text-slate-700'}`}>
                    {r.margin.toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
