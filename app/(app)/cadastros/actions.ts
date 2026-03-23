'use server'
import { revalidatePath } from 'next/cache'
import { upsertCompany, deleteCompany } from '@/lib/db/companies'
import { upsertClient, deleteClient } from '@/lib/db/clients'
import { upsertSupplier, deleteSupplier } from '@/lib/db/suppliers'
import { upsertAccount, deleteAccount } from '@/lib/db/chart-of-accounts'

// --- Empresas ---
export async function saveEmpresaAction(data: {
  id?: string; name: string; cnpj?: string;
  inscricao_municipal?: string; address?: string; cep?: string
}) {
  await upsertCompany(data)
  revalidatePath('/cadastros/empresas')
}

export async function deleteEmpresaAction(id: string) {
  await deleteCompany(id)
  revalidatePath('/cadastros/empresas')
}

// --- Clientes ---
export async function saveClienteAction(data: {
  id?: string; name: string; company_id?: string | null; segment?: string | null; status?: string | null;
  cnpj?: string | null; razao_social?: string | null; city?: string | null; address?: string | null; cep?: string | null;
  tel?: string | null; responsible?: string | null; email?: string | null; contract_no?: string | null;
  contract_start?: string | null; contract_end?: string | null; contract_value?: number | null;
  num_collaborators?: number | null; payment_day?: number | null; payment_method?: string | null;
}) {
  await upsertClient(data)
  revalidatePath('/cadastros/clientes')
}

export async function deleteClienteAction(id: string) {
  await deleteClient(id)
  revalidatePath('/cadastros/clientes')
}

// --- Fornecedores ---
export async function saveFornecedorAction(data: {
  id?: string; name: string; company_id?: string | null; cnpj?: string | null; razao_social?: string | null;
  city?: string | null; address?: string | null; cep?: string | null; tel?: string | null; contract_no?: string | null;
  contract_start?: string | null; contract_end?: string | null; status?: string | null; value?: number | null;
  object?: string | null; due_day?: number | null; item?: string | null;
}) {
  await upsertSupplier(data)
  revalidatePath('/cadastros/fornecedores')
}

export async function deleteFornecedorAction(id: string) {
  await deleteSupplier(id)
  revalidatePath('/cadastros/fornecedores')
}

// --- Plano de Contas ---
export async function saveContaAction(data: {
  id?: string; code: string; account: string;
  sub_account?: string; description: string; category: string
}) {
  await upsertAccount(data)
  revalidatePath('/cadastros/plano-de-contas')
}

export async function deleteContaAction(id: string) {
  await deleteAccount(id)
  revalidatePath('/cadastros/plano-de-contas')
}
