import { getCompanies } from '@/lib/db/companies'
import { EmpresasTable } from '@/components/cadastros/empresas-table'

export default async function EmpresasPage() {
  const companies = await getCompanies()
  return <EmpresasTable companies={companies} />
}
