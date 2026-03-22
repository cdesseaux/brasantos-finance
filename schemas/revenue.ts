import { z } from 'zod'

const num = z.coerce.number<number>().min(0)

export const revenueSchema = z.object({
  competencia: z.string().min(1, 'Obrigatório'),
  company_id: z.string().uuid('Selecione uma empresa'),
  client_id: z.string().uuid('Selecione um cliente'),
  account_id: z.string().uuid().optional().nullable(),
  nf_number: z.string().optional(),
  status: z.enum(['RECEBIDO', 'A RECEBER', 'A VERIFICAR']),
  issue_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  payment_date: z.string().optional().nullable(),
  // Service values
  total_services: num,
  materials: num,
  equipment: num,
  // VT 44h/s
  vt_44_qty: num, vt_44_unit: num, vt_44_days: num, vt_44_total: num,
  // VT 12x36
  vt_12_qty: num, vt_12_unit: num, vt_12_days: num, vt_12_total: num,
  // VA 44h/s
  va_44_qty: num, va_44_unit: num, va_44_days: num, va_44_total: num,
  // VA 12x36
  va_12_qty: num, va_12_unit: num, va_12_days: num, va_12_total: num,
  // Uniforme 44h/s
  unif_44_qty: num, unif_44_unit: num, unif_44_year: num, unif_44_total: num,
  // Uniforme 12x36
  unif_12_qty: num, unif_12_unit: num, unif_12_year: num, unif_12_total: num,
  // Tax retention
  retention_base_inss: num, calc_base_inss: num,
  gps_2632: num, irpj_2089: num, csll_2372: num,
  cofins_2172: num, pis_8109: num, issqn_1732: num,
  total_retention: num,
  net_value: num,
})

export type RevenueFormData = z.infer<typeof revenueSchema>
