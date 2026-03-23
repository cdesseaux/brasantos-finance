import { getClients } from '@/lib/db/clients'
import { getCompanies } from '@/lib/db/companies'
import { ClientesTable } from '@/components/cadastros/clientes-table'

export default async function ClientesPage() {
  const [clients, companies] = await Promise.all([getClients(), getCompanies()])
  return <ClientesTable clients={clients as Parameters<typeof ClientesTable>[0]['clients']} companies={companies} />
}
