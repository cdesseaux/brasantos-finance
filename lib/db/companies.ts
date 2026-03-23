import { createClient } from '@/lib/supabase/server'

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('companies').select('*').order('name')
  if (error) throw error
  return data
}

export async function upsertCompany(company: {
  id?: string; name: string; cnpj?: string;
  inscricao_municipal?: string; address?: string; cep?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('companies').upsert(company).select().single()
  if (error) throw error
  return data
}

export async function deleteCompany(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').delete().eq('id', id)
  if (error) throw error
}
