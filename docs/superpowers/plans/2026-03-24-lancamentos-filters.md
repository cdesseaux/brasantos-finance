# Filtros em Lançamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 client-side filters (Empresa, Tipo, Fornecedor, Cliente, Conta Contábil, Status) to the Lançamentos page with active-filter chips, a counter, and a differentiated zero-result message.

**Architecture:** All filtering happens client-side via `useMemo` inside `LancamentosClient` — no re-fetch, no URL params. `TransactionList` receives the filtered array plus two new props (`activeFilters: boolean`, `onClearFilters: () => void`) to render a context-aware empty state.

**Tech Stack:** Next.js 15, React 19, TypeScript strict, Jest + ts-jest (node env, no DOM)

---

## Files

| File | Change |
|---|---|
| `components/lancamentos/transaction-list.tsx` | Extend `Transaction` type; add `activeFilters` + `onClearFilters` props; update empty state |
| `components/lancamentos/lancamentos-client.tsx` | Add filter state, `useMemo` logic, filter bar UI, chips row |
| `__tests__/utils/lancamentos-filters.test.ts` | Unit tests for filter logic (pure function extracted for testability) |
| `lib/utils/lancamentos-filters.ts` | Pure filter function — extracted so it can be unit tested without React |

---

## Task 1: Extract and test the filter logic as a pure function

**Files:**
- Create: `lib/utils/lancamentos-filters.ts`
- Create: `__tests__/utils/lancamentos-filters.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `__tests__/utils/lancamentos-filters.test.ts`:

```ts
import { applyLancamentosFilters, type LancamentosFilters } from '@/lib/utils/lancamentos-filters'

const base = {
  id: '1',
  type: 'expense' as const,
  status: 'A PAGAR',
  companies: { name: 'BAS Tech' },
  suppliers: { name: 'AWS' },
  clients: null,
  chart_of_accounts: { code: '3.1', description: 'Serviços', category: 'DESPESA' },
}

const revenue = {
  id: '2',
  type: 'revenue' as const,
  status: 'A RECEBER',
  companies: { name: 'BAS Holding' },
  suppliers: null,
  clients: { name: 'Cliente X' },
  chart_of_accounts: null,
}

const empty: LancamentosFilters = { empresa: '', tipo: '', fornecedor: '', cliente: '', conta: '', status: '' }

describe('applyLancamentosFilters', () => {
  it('returns all when no filters active', () => {
    expect(applyLancamentosFilters([base, revenue], empty)).toHaveLength(2)
  })

  it('filters by empresa', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, empresa: 'BAS Tech' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by tipo expense', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, tipo: 'expense' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by tipo revenue', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, tipo: 'revenue' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by fornecedor', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, fornecedor: 'AWS' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by cliente', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, cliente: 'Cliente X' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('filters by conta — matches expense with code', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, conta: '3.1 — Serviços' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('filters by conta — revenue (no code) never matches', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, conta: '3.1 — Serviços' })
    expect(result.find(t => t.id === '2')).toBeUndefined()
  })

  it('filters by status', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, status: 'A PAGAR' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('combines multiple filters (AND logic)', () => {
    const result = applyLancamentosFilters([base, revenue], { ...empty, empresa: 'BAS Tech', tipo: 'expense' })
    expect(result).toHaveLength(1)
  })

  it('returns empty array when no match', () => {
    expect(applyLancamentosFilters([base], { ...empty, empresa: 'Nobody' })).toHaveLength(0)
  })
})
```

- [ ] **Step 1.2: Run tests — expect FAIL (module not found)**

```bash
cd /c/Users/User/projetos/brasantos_finance/.claude/worktrees/stoic-elion
npx jest __tests__/utils/lancamentos-filters.test.ts --no-coverage
```

Expected: `Cannot find module '@/lib/utils/lancamentos-filters'`

- [ ] **Step 1.3: Implement the pure filter function**

Create `lib/utils/lancamentos-filters.ts`:

```ts
export interface LancamentosFilters {
  empresa: string
  tipo: string
  fornecedor: string
  cliente: string
  conta: string
  status: string
}

interface FilterableTransaction {
  id: string
  type: 'expense' | 'revenue'
  status: string
  companies?: { name: string } | null
  suppliers?: { name: string } | null
  clients?: { name: string } | null
  chart_of_accounts?: { code?: string; description: string; category?: string } | null
}

export function applyLancamentosFilters<T extends FilterableTransaction>(
  transactions: T[],
  filters: LancamentosFilters,
): T[] {
  return transactions.filter(t => {
    if (filters.empresa && t.companies?.name !== filters.empresa) return false
    if (filters.tipo && t.type !== filters.tipo) return false
    if (filters.fornecedor && t.suppliers?.name !== filters.fornecedor) return false
    if (filters.cliente && t.clients?.name !== filters.cliente) return false
    if (filters.conta) {
      const label = t.chart_of_accounts?.code
        ? `${t.chart_of_accounts.code} — ${t.chart_of_accounts.description}`
        : null
      if (label !== filters.conta) return false
    }
    if (filters.status && t.status !== filters.status) return false
    return true
  })
}
```

- [ ] **Step 1.4: Run tests — expect all PASS**

```bash
npx jest __tests__/utils/lancamentos-filters.test.ts --no-coverage
```

Expected: 11 tests pass

- [ ] **Step 1.5: Commit**

```bash
git add lib/utils/lancamentos-filters.ts __tests__/utils/lancamentos-filters.test.ts
git commit -m "feat: extract applyLancamentosFilters pure function with tests"
```

---

## Task 2: Extend Transaction type and update TransactionList empty state

**Files:**
- Modify: `components/lancamentos/transaction-list.tsx`

- [ ] **Step 2.1: Extend `Transaction` interface and update props/empty state**

In `components/lancamentos/transaction-list.tsx`:

1. Add `chart_of_accounts` to `Transaction`:

```ts
export interface Transaction {
  id: string
  description?: string | null
  due_date?: string | null
  status: string
  total?: number | null
  net_value?: number | null
  type: 'expense' | 'revenue'
  companies?: { name: string } | null
  clients?: { name: string } | null
  suppliers?: { name: string } | null
  chart_of_accounts?: { code?: string; description: string; category?: string } | null
}
```

2. Add props to `TransactionListProps`:

```ts
interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (t: Transaction) => void
  onDelete?: (id: string, type: 'expense' | 'revenue') => void
  activeFilters?: boolean
  onClearFilters?: () => void
}
```

3. Update the empty state at the top of the render function:

```ts
export function TransactionList({ transactions, onEdit, onDelete, activeFilters, onClearFilters }: TransactionListProps) {
  if (transactions.length === 0) {
    if (activeFilters) {
      return (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm">Nenhum lançamento encontrado para os filtros selecionados.</p>
          {onClearFilters && (
            <button onClick={onClearFilters} className="text-blue-600 text-sm mt-2 underline">
              Limpar filtros
            </button>
          )}
        </div>
      )
    }
    return <p className="text-slate-500 text-sm py-8 text-center">Nenhum lançamento encontrado.</p>
  }
  // ... rest unchanged
```

- [ ] **Step 2.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 2.3: Commit**

```bash
git add components/lancamentos/transaction-list.tsx
git commit -m "feat: extend Transaction type with chart_of_accounts, add filter-aware empty state"
```

---

## Task 3: Add filter bar and chips to LancamentosClient

**Files:**
- Modify: `components/lancamentos/lancamentos-client.tsx`

- [ ] **Step 3.1: Fix Props type and add imports + filter state**

**3.1a — Fix the `Props.transactions` type** (required to avoid TypeScript errors when accessing `chart_of_accounts`):

In `lancamentos-client.tsx`, change the `Props` interface:

```ts
// Before
transactions: (Transaction & { [key: string]: unknown })[]

// After
transactions: Transaction[]
```

Also update the `useState` for `editTarget` and the `handleEdit` cast accordingly:

```ts
// Before
const [editTarget, setEditTarget] = useState<(Transaction & { [key: string]: unknown }) | null>(null)
function handleEdit(t: Transaction) {
  setEditTarget(t as Transaction & { [key: string]: unknown })

// After
const [editTarget, setEditTarget] = useState<Transaction | null>(null)
function handleEdit(t: Transaction) {
  setEditTarget(t)
```

**3.1b — Add imports:**

Replace `import { useState }` with:

```ts
import { useMemo, useState } from 'react'
import { applyLancamentosFilters, type LancamentosFilters } from '@/lib/utils/lancamentos-filters'
```

**3.1c — Add filter state inside the component**, after the existing state declarations:

```ts
const [filters, setFilters] = useState<LancamentosFilters>({
  empresa: '', tipo: '', fornecedor: '', cliente: '', conta: '', status: '',
})

const filteredTransactions = useMemo(
  () => applyLancamentosFilters(transactions, filters),
  [transactions, filters],
)

const hasActiveFilters = Object.values(filters).some(Boolean)

function setFilter(key: keyof LancamentosFilters, value: string) {
  setFilters(prev => ({ ...prev, [key]: value }))
}

function clearAll() {
  setFilters({ empresa: '', tipo: '', fornecedor: '', cliente: '', conta: '', status: '' })
}

// Dynamic dropdown options derived from loaded transactions
const empresaOptions = [...new Set(transactions.map(t => t.companies?.name).filter(Boolean))] as string[]
const fornecedorOptions = [...new Set(transactions.map(t => t.suppliers?.name).filter(Boolean))] as string[]
const clienteOptions = [...new Set(transactions.map(t => t.clients?.name).filter(Boolean))] as string[]
const contaOptions = [...new Set(
  transactions
    .map(t => t.chart_of_accounts?.code
      ? `${t.chart_of_accounts.code} — ${t.chart_of_accounts.description}`
      : null)
    .filter(Boolean)
)] as string[]
const statusOptions = [...new Set(transactions.map(t => t.status).filter(Boolean))] as string[]

const TIPO_LABELS: Record<string, string> = { expense: 'Despesa', revenue: 'Receita' }
const TIPO_VALUES: Record<string, string> = { Despesa: 'expense', Receita: 'revenue' }
```

- [ ] **Step 3.2: Add filter bar and chips UI**

Replace the current content inside the outer `<div className="p-4 md:p-6">` with the following (keep all existing header and drawer logic, only insert the filter bar between the header and `<TransactionList>`):

```tsx
{/* Filter bar */}
<div className="flex gap-2 flex-wrap mb-2">
  {empresaOptions.length > 0 && (
    <select
      value={filters.empresa}
      onChange={e => setFilter('empresa', e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
    >
      <option value="">Empresa</option>
      {empresaOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )}
  <select
    value={filters.tipo}
    onChange={e => setFilter('tipo', e.target.value)}
    className="border rounded-md px-2 py-1 text-sm"
  >
    <option value="">Tipo</option>
    <option value="expense">Despesa</option>
    <option value="revenue">Receita</option>
  </select>
  {fornecedorOptions.length > 0 && (
    <select
      value={filters.fornecedor}
      onChange={e => setFilter('fornecedor', e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
    >
      <option value="">Fornecedor</option>
      {fornecedorOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )}
  {clienteOptions.length > 0 && (
    <select
      value={filters.cliente}
      onChange={e => setFilter('cliente', e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
    >
      <option value="">Cliente</option>
      {clienteOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )}
  {contaOptions.length > 0 && (
    <select
      value={filters.conta}
      onChange={e => setFilter('conta', e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
    >
      <option value="">Conta</option>
      {contaOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )}
  {statusOptions.length > 0 && (
    <select
      value={filters.status}
      onChange={e => setFilter('status', e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
    >
      <option value="">Status</option>
      {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )}
</div>

{/* Active chips */}
{hasActiveFilters && (
  <div className="flex gap-2 flex-wrap items-center mb-4">
    {filters.empresa && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Empresa: {filters.empresa}
        <button onClick={() => setFilter('empresa', '')} className="ml-1">✕</button>
      </span>
    )}
    {filters.tipo && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Tipo: {TIPO_LABELS[filters.tipo]}
        <button onClick={() => setFilter('tipo', '')} className="ml-1">✕</button>
      </span>
    )}
    {filters.fornecedor && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Fornecedor: {filters.fornecedor}
        <button onClick={() => setFilter('fornecedor', '')} className="ml-1">✕</button>
      </span>
    )}
    {filters.cliente && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Cliente: {filters.cliente}
        <button onClick={() => setFilter('cliente', '')} className="ml-1">✕</button>
      </span>
    )}
    {filters.conta && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Conta: {filters.conta}
        <button onClick={() => setFilter('conta', '')} className="ml-1">✕</button>
      </span>
    )}
    {filters.status && (
      <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-3 py-1">
        Status: {filters.status}
        <button onClick={() => setFilter('status', '')} className="ml-1">✕</button>
      </span>
    )}
    <button onClick={clearAll} className="text-slate-400 text-xs underline">Limpar tudo</button>
    <span className="text-slate-400 text-xs">— {filteredTransactions.length} de {transactions.length} lançamentos</span>
  </div>
)}
```

Update `<TransactionList>` call to pass filtered data and new props:

```tsx
<TransactionList
  transactions={filteredTransactions}
  onEdit={handleEdit}
  onDelete={handleDelete}
  activeFilters={hasActiveFilters}
  onClearFilters={clearAll}
/>
```

- [ ] **Step 3.3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3.5: Run full test suite**

> Note: the `conta` filter label uses an em-dash (`—`, U+2014) — make sure to copy it exactly, not substitute a regular hyphen.

```bash
npx jest --no-coverage
```

Expected: all tests pass (including the new `lancamentos-filters` tests)

- [ ] **Step 3.6: Commit**

```bash
git add components/lancamentos/lancamentos-client.tsx
git commit -m "feat: add client-side filters to Lançamentos (empresa, tipo, fornecedor, cliente, conta, status)"
```

---

## Task 4: Push and merge

- [ ] **Step 4.1: Push and merge to master**

```bash
git push origin claude/stoic-elion
cd /c/Users/User/projetos/brasantos_finance
git merge claude/stoic-elion
git push origin master
```
