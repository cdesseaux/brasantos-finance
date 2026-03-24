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
