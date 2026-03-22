import { formatBRL } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompanyCardProps {
  name: string
  revenue: number
  expense: number
  balance: number
}

export function CompanyCard({ name, revenue, expense, balance }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-green-600">Receita</span>
          <span className="font-medium">{formatBRL(revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-500">Despesa</span>
          <span className="font-medium">{formatBRL(expense)}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="font-semibold">Saldo</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatBRL(balance)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
