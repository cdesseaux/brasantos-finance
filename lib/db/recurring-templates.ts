import { createClient } from '@/lib/supabase/server'

export async function getRecurringTemplates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*, companies(name), suppliers(name), chart_of_accounts(description)')
    .order('name')
  if (error) throw error
  return data
}
