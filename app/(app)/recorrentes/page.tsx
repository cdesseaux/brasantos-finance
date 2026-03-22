import { getRecurringTemplates } from '@/lib/db/recurring-templates'
import { getCompanies } from '@/lib/db/companies'
import { getSuppliers } from '@/lib/db/suppliers'
import { getChartOfAccounts } from '@/lib/db/chart-of-accounts'
import { RecorrentesClient } from '@/components/recorrentes/recorrentes-client'

export default async function RecorrentesPage() {
  const [templates, companies, suppliers, accounts] = await Promise.all([
    getRecurringTemplates(),
    getCompanies(),
    getSuppliers(),
    getChartOfAccounts(),
  ])

  return (
    <RecorrentesClient
      templates={templates ?? []}
      companies={companies ?? []}
      suppliers={suppliers ?? []}
      accounts={accounts ?? []}
    />
  )
}
