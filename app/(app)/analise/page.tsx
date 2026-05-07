import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientDREList } from '@/components/analise/client-dre-list'
import { ClientCrossTable } from '@/components/analise/client-cross-table'
import { PeriodSelect } from '@/components/relatorios/period-select'
import { getClientDREData } from '@/lib/db/analytics'
import { currentCompetencia, formatCompetencia } from '@/lib/utils/date'

export default async function AnalisePage({
  searchParams
}: { searchParams: Promise<{ comp?: string }> }) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()
  const year = parseInt(comp.split('-')[0])
  const { results, overhead, clients } = await getClientDREData(comp)

  const clientNames: Record<string, string> = {}
  for (const c of clients) {
    clientNames[c.id] = c.name
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Análise de Clientes — {formatCompetencia(comp)}</h1>
        <PeriodSelect value={comp} />
      </div>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Por cliente</TabsTrigger>
          <TabsTrigger value="table">Tabela cruzada</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ClientDREList results={results} overhead={overhead} clientNames={clientNames} />
        </TabsContent>
        <TabsContent value="table">
          <ClientCrossTable year={year} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
