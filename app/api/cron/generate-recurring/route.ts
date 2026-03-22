import { createClient } from '@supabase/supabase-js'
import { shouldGenerateThisMonth } from '@/lib/utils/recurring'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
  }

  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, serviceKey)

  const now = new Date()
  const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: templates } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('active', true)

  let generated = 0

  for (const template of templates ?? []) {
    if (!shouldGenerateThisMonth(template, now)) continue

    // Idempotency: check if already generated this month
    const { data: existing } = await supabase
      .from('expense_transactions')
      .select('id')
      .eq('recurring_template_id', template.id)
      .eq('competencia', competencia)
      .maybeSingle()

    if (existing) continue

    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(template.due_day).padStart(2, '0')

    await supabase.from('expense_transactions').insert({
      competencia,
      account_id: template.account_id,
      company_id: template.company_id,
      client_id: template.client_id,
      supplier_id: template.supplier_id,
      doc_type: template.doc_type,
      description: template.description ?? template.name,
      due_date: `${year}-${month}-${day}`,
      status: 'A PAGAR',
      principal: template.value,
      fine: 0,
      interest: 0,
      recurring_template_id: template.id,
    })

    if (template.frequency === 'installments') {
      await supabase
        .from('recurring_templates')
        .update({ generated_count: (template.generated_count ?? 0) + 1 })
        .eq('id', template.id)
    }

    generated++
  }

  return NextResponse.json({ ok: true, generated, competencia })
}
