# Seletor de Período em /analise — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar seletor de período (mês/ano) à página `/analise`, afetando a aba "Por cliente" (mês selecionado) e a aba "Tabela cruzada" (ano derivado do mês).

**Architecture:** Reusa o componente `PeriodSelect` já existente em `components/relatorios/period-select.tsx`. Ele atualiza o query param `?comp=YYYY-MM` via `router.push`. A página `/analise` já lê `searchParams.comp` e usa `currentCompetencia()` como fallback. A única mudança é: expor o seletor na UI e derivar `year` de `comp` para passar ao `ClientCrossTable`.

**Tech Stack:** Next.js 14 App Router (server component), TypeScript, Tailwind CSS, componente `PeriodSelect` já existente.

---

### Task 1: Adicionar seletor de período à página /analise

**Files:**
- Modify: `app/(app)/analise/page.tsx`

- [ ] **Step 1: Verificar o estado atual do arquivo**

```bash
cat "app/(app)/analise/page.tsx"
```

Conteúdo esperado — página sem `PeriodSelect` e com `year={new Date().getFullYear()}` hardcoded no `ClientCrossTable`.

- [ ] **Step 2: Aplicar as mudanças no arquivo**

Substituir o conteúdo completo de `app/(app)/analise/page.tsx` por:

```tsx
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
```

- [ ] **Step 3: Verificar tipos com TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Testar visualmente no browser**

Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```

Acessar `http://localhost:3000/analise` e verificar:
1. Seletor de período aparece no canto superior direito do cabeçalho
2. O seletor mostra os últimos 12 meses
3. Ao trocar o mês, a URL muda para `?comp=YYYY-MM` e a aba "Por cliente" recarrega com os dados do mês selecionado
4. Ao trocar para a aba "Tabela cruzada", os meses exibidos correspondem ao ano do período selecionado (ex: selecionar mai/2025 → tabela mostra jan–dez/2025)
5. Sem `?comp` na URL (acesso direto), continua exibindo o mês atual

- [ ] **Step 5: Commit**

```bash
git add app/(app)/analise/page.tsx
git commit -m "feat: add period selector to /analise page"
```
