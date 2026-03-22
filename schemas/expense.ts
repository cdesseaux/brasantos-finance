import { z } from 'zod'

export const expenseSchema = z.object({
  competencia: z.string().min(1, 'Obrigatório'),
  account_id: z.string().uuid('Selecione uma conta'),
  company_id: z.string().uuid('Selecione uma empresa'),
  client_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  doc_type: z.string().optional(),
  doc_number: z.string().optional(),
  description: z.string().optional(),
  installment: z.string().optional(),
  issue_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  payment_date: z.string().optional().nullable(),
  status: z.enum(['PAGO', 'A PAGAR', 'A VERIFICAR']),
  principal: z.coerce.number<number>().min(0),
  fine: z.coerce.number<number>().min(0),
  interest: z.coerce.number<number>().min(0),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
