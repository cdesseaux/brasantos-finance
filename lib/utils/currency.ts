export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseBRL(value: string): number {
  // Remove R$ prefix and surrounding whitespace (including non-breaking space)
  const stripped = value.replace(/R\$[\s\u00a0]*/g, '').trim()

  // If the string uses Brazilian format (comma as decimal separator), convert it
  if (stripped.includes(',')) {
    // Remove thousands dots, then replace decimal comma with dot
    const cleaned = stripped.replace(/\./g, '').replace(',', '.')
    return parseFloat(cleaned) || 0
  }

  // Plain number string (e.g. '1808.57') — parse directly
  return parseFloat(stripped) || 0
}
