import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type ClientRow = Database['public']['Tables']['clients']['Row']

export async function getClients(filters?: { segment?: string; status?: string }) {
  const supabase = await createClient()
  let query = supabase.from('clients').select('*, companies(name)').order('name')
  if (filters?.segment) query = query.eq('segment', filters.segment)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getActiveClients() {
  return getClients({ status: 'ATIVO' })
}

export async function upsertClient(client: Partial<ClientRow> & { name: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clients').upsert(client).select().single()
  if (error) throw error
  return data
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function getRealClients() {
  // Exclude ADM/OPERACIONAL/BANCO — these are internal cost centers
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, segment, company_id, companies(name)')
    .not('segment', 'in', '("ADM","OPERACIONAL","BANCO")')
    .eq('status', 'ATIVO')
    .order('name')
  if (error) throw error
  return data
}
