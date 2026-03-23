import { getSuppliers } from '@/lib/db/suppliers'
import { getCompanies } from '@/lib/db/companies'
import { FornecedoresTable } from '@/components/cadastros/fornecedores-table'

export default async function FornecedoresPage() {
  const [suppliers, companies] = await Promise.all([getSuppliers(), getCompanies()])
  return <FornecedoresTable suppliers={suppliers as Parameters<typeof FornecedoresTable>[0]['suppliers']} companies={companies} />
}
