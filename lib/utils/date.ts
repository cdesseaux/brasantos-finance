import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converts DB competência 'YYYY-MM' to display format 'MM/YYYY'
 * e.g. '2026-01' → '01/2026'
 */
export function formatCompetencia(raw: string): string {
  if (!raw) return ''
  const [year, month] = raw.split('-')
  if (!year || !month) return raw
  return `${month}/${year}`
}

/**
 * Returns current month as YYYY-MM string, e.g. '2026-03'
 */
export function currentCompetencia(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Returns list of last N months as YYYY-MM strings, most recent first
 */
export function lastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${year}-${month}`)
  }
  return months
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}
