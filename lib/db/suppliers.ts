import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type SupplierRow = Database['public']['Tables']['suppliers']['Row']

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, companies(name)')
    .order('name')
  if (error) throw error
  return data
}

export async function upsertSupplier(supplier: Partial<SupplierRow> & { name: string }) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('suppliers').upsert(supplier).select().single()
  if (error) throw error
  return data
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}
