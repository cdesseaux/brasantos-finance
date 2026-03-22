import { shouldGenerateThisMonth } from '@/lib/utils/recurring'

describe('shouldGenerateThisMonth', () => {
  const now = new Date('2026-03-01')

  it('monthly template always generates', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'monthly', due_month: null, start_month: '2026-01', end_month: null },
      now
    )).toBe(true)
  })

  it('monthly template does not generate before start_month', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'monthly', due_month: null, start_month: '2026-05', end_month: null },
      now
    )).toBe(false)
  })

  it('annual template generates when month matches', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'annual', due_month: 3, start_month: '2026-01', end_month: null },
      now
    )).toBe(true)
  })

  it('annual template does not generate when month does not match', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'annual', due_month: 5, start_month: '2026-01', end_month: null },
      now
    )).toBe(false)
  })

  it('installments template generates when under limit', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'installments', num_installments: 12, generated_count: 5 },
      now
    )).toBe(true)
  })

  it('installments template stops when limit reached', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'installments', num_installments: 12, generated_count: 12 },
      now
    )).toBe(false)
  })
})
