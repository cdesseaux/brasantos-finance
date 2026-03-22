import { createClient } from '@/lib/supabase/server'

export async function getChartOfAccounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .order('code')
  if (error) throw error
  return data
}

export async function upsertAccount(account: {
  id?: string; code: string; account: string;
  sub_account?: string; description: string; category: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .upsert(account)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id)
  if (error) throw error
}
