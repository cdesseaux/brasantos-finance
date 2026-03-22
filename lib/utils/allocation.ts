export interface ClientDREInput {
  clientId: string
  revenue: number
  directExpenses: number
  overhead: number
  totalHoldingRevenue: number
}

export interface ClientDREResult {
  clientId: string
  revenue: number
  directExpenses: number
  indirectExpenses: number
  netResult: number
  participationPct: number
  margin: number
}

export function calculateClientDRE(input: ClientDREInput): ClientDREResult {
  const { clientId, revenue, directExpenses, overhead, totalHoldingRevenue } = input
  const participationPct = totalHoldingRevenue > 0
    ? (revenue / totalHoldingRevenue) * 100
    : 0
  const indirectExpenses = totalHoldingRevenue > 0
    ? overhead * (revenue / totalHoldingRevenue)
    : 0
  const netResult = revenue - directExpenses - indirectExpenses
  const margin = revenue > 0 ? (netResult / revenue) * 100 : 0
  return { clientId, revenue, directExpenses, indirectExpenses, netResult, participationPct, margin }
}
