import { createClient } from '@/lib/supabase/server'

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('companies').select('*').order('name')
  if (error) throw error
  return data
}
