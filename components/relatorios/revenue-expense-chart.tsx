'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCompetencia } from '@/lib/utils/date'

interface ChartData { month: string; revenue: number; expense: number }

export function RevenueExpenseChart({ data }: { data: ChartData[] }) {
  const displayData = data.map(d => ({ ...d, monthLabel: formatCompetencia(d.month) }))
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={displayData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `R$${(Number(v) / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: unknown) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
        <Legend />
        <Bar dataKey="revenue" name="Receita" fill="#22c55e" />
        <Bar dataKey="expense" name="Despesa" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}
