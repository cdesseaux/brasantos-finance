import { getChartOfAccounts } from '@/lib/db/chart-of-accounts'
import { ContasTable } from '@/components/cadastros/contas-table'

export default async function PlanoDeContasPage() {
  const accounts = await getChartOfAccounts()
  return <ContasTable accounts={accounts} />
}
