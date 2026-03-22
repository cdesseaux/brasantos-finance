import { calculateClientDRE } from '@/lib/utils/allocation'

describe('calculateClientDRE', () => {
  const clientId = 'client-1'

  it('calculates result with no overhead', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 24300,
      directExpenses: 12100,
      overhead: 0,
      totalHoldingRevenue: 100000,
    })
    expect(result.indirectExpenses).toBe(0)
    expect(result.netResult).toBe(12200)
    expect(result.participationPct).toBeCloseTo(24.3)
  })

  it('allocates overhead proportionally', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 50000,
      directExpenses: 20000,
      overhead: 10000,
      totalHoldingRevenue: 100000,
    })
    expect(result.indirectExpenses).toBe(5000) // 50% of overhead
    expect(result.netResult).toBe(25000)
    expect(result.margin).toBe(50)
  })

  it('handles zero holding revenue gracefully', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 0,
      directExpenses: 0,
      overhead: 5000,
      totalHoldingRevenue: 0,
    })
    expect(result.indirectExpenses).toBe(0)
    expect(result.participationPct).toBe(0)
  })
})
