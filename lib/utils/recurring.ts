interface TemplateCheck {
  frequency: string
  due_month?: number | null
  start_month?: string | null
  end_month?: string | null
  num_installments?: number | null
  generated_count?: number | null
}

export function shouldGenerateThisMonth(template: TemplateCheck, now = new Date()): boolean {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const currentYYYYMM = `${year}-${String(month).padStart(2, '0')}`

  if (template.start_month && currentYYYYMM < template.start_month) return false
  if (template.end_month && currentYYYYMM > template.end_month) return false

  if (template.frequency === 'monthly') return true
  if (template.frequency === 'annual') return (template.due_month ?? -1) === month
  if (template.frequency === 'installments') {
    return (template.generated_count ?? 0) < (template.num_installments ?? 0)
  }
  return false
}
