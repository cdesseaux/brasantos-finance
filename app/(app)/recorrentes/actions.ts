'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RecurringTemplatePayload {
  id?: string
  name: string
  company_id: string
  supplier_id?: string | null
  client_id?: string | null
  account_id?: string | null
  doc_type?: string | null
  description?: string | null
  frequency: 'monthly' | 'annual' | 'installments'
  due_day: number
  due_month?: number | null
  start_month: string
  end_month?: string | null
  num_installments?: number | null
  value: number
  active?: boolean
}

export async function saveRecurringTemplate(data: RecurringTemplatePayload) {
  const supabase = await createClient()
  const { error } = data.id
    ? await supabase.from('recurring_templates').update(data).eq('id', data.id)
    : await supabase.from('recurring_templates').insert(data)
  if (error) throw error
  revalidatePath('/recorrentes')
}

export async function toggleTemplateActive(id: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_templates')
    .update({ active })
    .eq('id', id)
  if (error) throw error
  revalidatePath('/recorrentes')
}

export async function deleteRecurringTemplate(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('recurring_templates').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/recorrentes')
}
