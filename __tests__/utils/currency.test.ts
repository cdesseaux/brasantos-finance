import { formatBRL, parseBRL } from '@/lib/utils/currency'

describe('formatBRL', () => {
  it('formats positive number', () => {
    expect(formatBRL(1808.57)).toBe('R$\u00a01.808,57')
  })
  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$\u00a00,00')
  })
  it('formats negative', () => {
    expect(formatBRL(-7200)).toBe('-R$\u00a07.200,00')
  })
})

describe('parseBRL', () => {
  it('parses formatted string', () => {
    expect(parseBRL('R$ 1.808,57')).toBe(1808.57)
  })
  it('parses plain number string', () => {
    expect(parseBRL('1808.57')).toBe(1808.57)
  })
})
