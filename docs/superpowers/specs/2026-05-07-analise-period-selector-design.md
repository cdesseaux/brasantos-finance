# Design: Seletor de Período na Página /analise

**Data:** 2026-05-07  
**Status:** Aprovado

## Contexto

A página `/analise` mostra a DRE por cliente. Atualmente exibe apenas o mês corrente, sem permitir ao usuário navegar para outros períodos.

## Objetivo

Permitir que o usuário selecione o período (mês/ano) desejado, afetando ambas as abas:
- **Por cliente** — exibe dados do mês selecionado
- **Tabela cruzada** — exibe os 12 meses do ano do período selecionado

## Solução

Reutilizar o componente `PeriodSelect` já existente em `components/relatorios/period-select.tsx`, que:
- É um componente client-side que atualiza o query param `?comp=YYYY-MM` via `router.push`
- Exibe os últimos 12 meses como opções
- Já é utilizado em `/relatorios` com o mesmo padrão

## Alterações

### `app/(app)/analise/page.tsx`

1. Importar `PeriodSelect` de `@/components/relatorios/period-select`
2. Adicionar `<PeriodSelect value={comp} />` no cabeçalho (título à esquerda, seletor à direita — flex row justify-between)
3. Derivar `year` do `comp`: `const year = parseInt(comp.split('-')[0])`
4. Substituir `year={new Date().getFullYear()}` por `year={year}` em `<ClientCrossTable>`

## Comportamento

| Ação do usuário | "Por cliente" | "Tabela cruzada" |
|---|---|---|
| Seleciona mai/2025 | Dados de mai/2025 | Jan–Dez/2025 |
| Seleciona jan/2026 | Dados de jan/2026 | Jan–Dez/2026 |

## Fora de escopo

- Novos componentes de UI
- Mudanças em endpoints ou queries
- Seleção de intervalos arbitrários (ex: trimestre)
