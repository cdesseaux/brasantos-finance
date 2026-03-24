# Filtros em Lançamentos

**Data:** 2026-03-24
**Status:** Aprovado

## Objetivo

Adicionar filtros client-side na página de Lançamentos para que o usuário consiga segmentar a lista por empresa, tipo, fornecedor, cliente, conta contábil e status — sem recarregar a página.

## Escopo

Alteração apenas em `components/lancamentos/lancamentos-client.tsx`. Nenhuma mudança em server actions, banco de dados ou outros componentes.

## Design

### Layout (Opção C aprovada)

Linha compacta de dropdowns acima da lista, com chips de filtros ativos abaixo:

```
[ Empresa ▾ ] [ Tipo ▾ ] [ Fornecedor ▾ ] [ Cliente ▾ ] [ Conta ▾ ] [ Status ▾ ]
Empresa: BAS Tech ✕  Tipo: Despesa ✕  [Limpar tudo]  — 5 de 18 lançamentos
```

### Filtros

| Filtro | Campo na transaction | Opções |
|---|---|---|
| Empresa | `companies.name` | Lista dinâmica das empresas recebidas via prop |
| Tipo | `type` | Despesa / Receita |
| Fornecedor | `suppliers.name` | Lista dinâmica dos fornecedores recebidos via prop |
| Cliente | `clients.name` | Lista dinâmica dos clientes recebidos via prop |
| Conta Contábil | `account_id` ou `chart_of_accounts.code+description` | Lista dinâmica das contas recebidas via prop |
| Status | `status` | PAGO, A PAGAR, A VERIFICAR, RECEBIDO, A RECEBER |

### Comportamento

- **Instantâneo**: filtra o array `transactions` já carregado no browser via `useMemo`, sem re-fetch
- **Chips ativos**: renderizados somente quando ao menos um filtro está ativo; cada chip remove o filtro individual ao clicar ✕
- **Contador**: exibe "X de Y lançamentos" junto aos chips quando há filtro ativo
- **Limpar tudo**: reseta todos os filtros de uma vez
- **Dropdowns populados dinamicamente** com os valores únicos presentes nas transações do mês (para evitar opções vazias)

## Arquitetura

Toda a lógica fica dentro do componente client existente `LancamentosClient`:

- Novo estado: `filters` objeto com 6 chaves (empresa, tipo, fornecedor, cliente, conta, status), valores string (`''` = sem filtro)
- `filteredTransactions` calculado com `useMemo` aplicando todos os filtros ativos sobre `transactions`
- Função `clearFilter(key)` e `clearAll()`
- `TransactionList` recebe `filteredTransactions` em vez de `transactions`

## Fora do escopo

- Filtros por intervalo de datas
- Filtros persistidos em URL
- Busca por texto livre
