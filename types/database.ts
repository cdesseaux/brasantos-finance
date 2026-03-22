// Auto-generated Supabase types
// Run: npx supabase gen types typescript --linked > types/database.ts
// after linking your Supabase project

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          cnpj: string | null
          inscricao_municipal: string | null
          address: string | null
          cep: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      chart_of_accounts: {
        Row: {
          id: string
          code: string
          account: string
          sub_account: string | null
          description: string
          category: 'RECEITA' | 'DESPESA' | 'DESPESAS BANCÁRIAS' | 'DESPESAS FIXAS' | 'ENCARGOS' | 'FOLHA DE PAGAMENTO' | 'SERVIÇOS DE TERCEIROS' | 'TRIBUTOS'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chart_of_accounts']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['chart_of_accounts']['Insert']>
      }
      clients: {
        Row: {
          id: string
          item: string | null
          uf: string | null
          status: string | null
          company_id: string | null
          year: number | null
          segment: string | null
          name: string
          razao_social: string | null
          cnpj: string | null
          inscricao: string | null
          city: string | null
          address: string | null
          cep: string | null
          tel: string | null
          responsible: string | null
          email: string | null
          contract_no: string | null
          contract_start: string | null
          contract_end: string | null
          contract_object: string | null
          num_collaborators: number | null
          contract_value: number | null
          payment_day: number | null
          payment_method: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
      }
      suppliers: {
        Row: {
          id: string
          item: string | null
          company_id: string | null
          name: string
          razao_social: string | null
          cnpj: string | null
          city: string | null
          address: string | null
          cep: string | null
          tel: string | null
          contract_no: string | null
          contract_start: string | null
          contract_end: string | null
          status: string | null
          value: number | null
          object: string | null
          due_day: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['suppliers']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['suppliers']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      recurring_templates: {
        Row: {
          id: string
          name: string
          company_id: string | null
          client_id: string | null
          supplier_id: string | null
          account_id: string | null
          doc_type: string | null
          description: string | null
          frequency: 'monthly' | 'annual' | 'installments'
          due_day: number
          due_month: number | null
          start_month: string
          end_month: string | null
          num_installments: number | null
          generated_count: number | null
          value: number
          active: boolean | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_templates']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['recurring_templates']['Insert']>
      }
      expense_transactions: {
        Row: {
          id: string
          competencia: string
          account_id: string | null
          company_id: string | null
          client_id: string | null
          supplier_id: string | null
          doc_type: string | null
          doc_number: string | null
          description: string | null
          installment: string | null
          issue_date: string | null
          due_date: string | null
          payment_date: string | null
          status: 'PAGO' | 'A PAGAR' | 'A VERIFICAR'
          principal: number | null
          fine: number | null
          interest: number | null
          total: number
          recurring_template_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['expense_transactions']['Row'], 'id' | 'total' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['expense_transactions']['Insert']>
      }
      revenue_transactions: {
        Row: {
          id: string
          competencia: string
          company_id: string | null
          client_id: string | null
          account_id: string | null
          nf_number: string | null
          status: 'RECEBIDO' | 'A RECEBER' | 'A VERIFICAR'
          issue_date: string | null
          due_date: string | null
          payment_date: string | null
          total_services: number | null
          materials: number | null
          equipment: number | null
          vt_44_qty: number | null
          vt_44_unit: number | null
          vt_44_days: number | null
          vt_44_total: number | null
          vt_12_qty: number | null
          vt_12_unit: number | null
          vt_12_days: number | null
          vt_12_total: number | null
          va_44_qty: number | null
          va_44_unit: number | null
          va_44_days: number | null
          va_44_total: number | null
          va_12_qty: number | null
          va_12_unit: number | null
          va_12_days: number | null
          va_12_total: number | null
          unif_44_qty: number | null
          unif_44_unit: number | null
          unif_44_year: number | null
          unif_44_total: number | null
          unif_12_qty: number | null
          unif_12_unit: number | null
          unif_12_year: number | null
          unif_12_total: number | null
          retention_base_inss: number | null
          calc_base_inss: number | null
          gps_2632: number | null
          irpj_2089: number | null
          csll_2372: number | null
          cofins_2172: number | null
          pis_8109: number | null
          issqn_1732: number | null
          total_retention: number | null
          net_value: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['revenue_transactions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['revenue_transactions']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
