/**
 * Excel → Supabase import script
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/import-excel.ts
 *
 * Imports:
 *   1. Companies         ← TA Empresa
 *   2. Chart of accounts ← TA Gerencial
 *   3. Clients           ← TA Cliente  (note trailing space in sheet name)
 *   4. Suppliers         ← TA Fornecedor
 *   5. Revenue txns      ← 2026_RECEITA_BRASANTOS, 2026_RECEITA _JJB SERV, 2026_RECEITA_JJB ADM
 *   6. Expense txns      ← JAN, FEV, MAR, ABR, MAI, JUN, JUL, AGO, SET, OUT, NOV, DEZ
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local first, then .env
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// ---------------------------------------------------------------------------
// Supabase client (service role bypasses RLS)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Excel file path
// ---------------------------------------------------------------------------
const EXCEL_PATH = path.resolve(__dirname, '..', 'Base_2026_ RECEITA X DESPESAS.xlsx');

// ---------------------------------------------------------------------------
// Category mapping: Excel value → DB enum
// DB enum: 'RECEITA' | 'DESPESA' | 'DESPESAS BANCÁRIAS' | 'DESPESAS FIXAS' |
//          'ENCARGOS' | 'FOLHA DE PAGAMENTO' | 'SERVIÇOS DE TERCEIROS' | 'TRIBUTOS'
// ---------------------------------------------------------------------------
const CATEGORY_MAP: Record<string, string> = {
  'RECEITA':               'RECEITA',
  'DESPESAS BANCÁRIAS':    'DESPESAS BANCÁRIAS',
  'DESPESAS FIXAS':        'DESPESAS FIXAS',
  'DESPESAS GERAIS':       'DESPESA',
  'ENCARGOS':              'ENCARGOS',
  'DESPESAS COM PESSOAL':  'FOLHA DE PAGAMENTO',
  'INVESTIMENTOS':         'DESPESA',
  'SERVIÇOS DE TERCEIROS': 'SERVIÇOS DE TERCEIROS',
  'TRIBUTOS':              'TRIBUTOS',
  'OVERHEAD':              'DESPESA',
  'PROVISÕES':             'DESPESA',
};

// ---------------------------------------------------------------------------
// Status mapping for expense transactions
// DB enum: 'PAGO' | 'A PAGAR' | 'A VERIFICAR'
// ---------------------------------------------------------------------------
function mapExpenseStatus(raw: string | null | undefined): 'PAGO' | 'A PAGAR' | 'A VERIFICAR' {
  const s = (raw ?? '').trim().toUpperCase();
  if (s === 'PAGO') return 'PAGO';
  if (s === 'A PAGAR') return 'A PAGAR';
  return 'A VERIFICAR';
}

// Status mapping for revenue transactions
// DB enum: 'RECEBIDO' | 'A RECEBER' | 'A VERIFICAR'
// Monthly sheets use expense-style status (PAGO/A PAGAR) — map to revenue equivalents
function mapRevenueStatus(raw: string | null | undefined): 'RECEBIDO' | 'A RECEBER' | 'A VERIFICAR' {
  const s = (raw ?? '').trim().toUpperCase();
  if (s === 'RECEBIDO' || s === 'PAGO') return 'RECEBIDO';
  if (s === 'A RECEBER' || s === 'A PAGAR') return 'A RECEBER';
  if (s === 'A VERIFICAR') return 'A VERIFICAR';
  return 'A RECEBER'; // default
}

// ---------------------------------------------------------------------------
// Competência converter: '1/26' or '01/24' → 'YYYY-MM'
// ---------------------------------------------------------------------------
function toCompetencia(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  // Formats seen in data: '1/26', '01/24', '3/26'
  const match = s.match(/^(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (year < 100) year += 2000;
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Excel serial date → ISO date string
// ---------------------------------------------------------------------------
function excelDateToISO(serial: number | null | undefined): string | null {
  if (!serial || typeof serial !== 'number') return null;
  // Excel epoch: Jan 0, 1900 (but has the 1900 leap year bug)
  const utc = (serial - 25569) * 86400 * 1000;
  const d = new Date(utc);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Month name → month number
// ---------------------------------------------------------------------------
const MONTH_MAP: Record<string, number> = {
  JAN: 1, FEV: 2, MAR: 3, ABR: 4, MAI: 5, JUN: 6,
  JUL: 7, AGO: 8, SET: 9, OUT: 10, NOV: 11, DEZ: 12,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log('Reading Excel file:', EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);

  // -----------------------------------------------------------------------
  // 1. Companies (TA Empresa)
  //    Cols: 0=EMPRESA, 1=CNPJ, 2=INSCRIÇÃO, 3=ENDEREÇO, 4=CEP
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Companies ---');
  const companyMap: Record<string, string> = {}; // name → id

  {
    const sheetName = 'TA Empresa';
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn('Sheet not found:', sheetName);
    } else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const dataRows = rows.slice(1); // skip header

      const records = dataRows
        .filter(row => row[0] != null && String(row[0]).trim() !== '')
        .map(row => ({
          name: String(row[0]).trim(),
          cnpj: row[1] ? String(row[1]).trim() : null,
          inscricao_municipal: row[2] ? String(row[2]).trim() : null,
          address: row[3] ? String(row[3]).trim() : null,
          cep: row[4] ? String(row[4]).trim() : null,
        }));

      if (records.length > 0) {
        const { data, error } = await supabase
          .from('companies')
          .upsert(records, { onConflict: 'name' })
          .select('id, name');
        if (error) console.error('Companies upsert error:', error.message);
        else {
          (data ?? []).forEach((c: { id: string; name: string }) => {
            companyMap[c.name] = c.id;
          });
          console.log(`  Upserted ${records.length} companies`);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 2. Chart of Accounts (TA Gerencial)
  //    Header row index 3: Código | CONTA | SUBCONTA | DESCRIÇÃO DA CONTA | Código2 | Categoria
  //    Data starts at row index 4.
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Chart of Accounts ---');
  const accountMap: Record<string, string> = {}; // code → id

  {
    const sheetName = 'TA Gerencial';
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn('Sheet not found:', sheetName);
    } else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const dataRows = rows.slice(4); // skip 4 metadata/header rows

      const records = dataRows
        .filter(row => row[0] != null && String(row[0]).trim() !== '' && row[5] != null)
        .map(row => {
          const rawCategory = String(row[5] ?? '').trim();
          const category = CATEGORY_MAP[rawCategory] ?? 'DESPESA';
          return {
            code: String(row[0]).trim(),
            account: row[1] ? String(row[1]).trim() : 'N/A',
            sub_account: row[2] ? String(row[2]).trim() : null,
            description: row[3] ? String(row[3]).trim() : String(row[0]).trim(),
            category,
          };
        });

      if (records.length > 0) {
        const { data, error } = await supabase
          .from('chart_of_accounts')
          .upsert(records, { onConflict: 'code' })
          .select('id, code');
        if (error) console.error('Chart of accounts upsert error:', error.message);
        else {
          (data ?? []).forEach((a: { id: string; code: string }) => {
            accountMap[a.code] = a.id;
          });
          console.log(`  Upserted ${records.length} chart of accounts entries`);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 3. Clients (TA Cliente  — note trailing space in sheet name)
  //    Row 1 (index 1) is the header.
  //    Cols: 1=ITEM, 2=UF, 3=STATUS, 4=EMPRESA, 5=ANO, 6=SEGMENTO,
  //          7=CLIENTE, 8=RAZÃO SOCIAL, 9=CNPJ, 10=INSCRIÇÃO, 11=CIDADE,
  //          12=ENDEREÇO, 13=CEP, 14=TEL, 15=RESPONSÁVEL, 16=E-MAIL,
  //          17=CT Nº, 18=INICIO, 19=TÉRMINO, 20=OBJETO, 21=QTDE,
  //          22=VALOR CONTRATUAL, 23=DATA PAGAMENTO, 24=FORMA DE PAGAMENTO
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Clients ---');
  const clientMap: Record<string, string> = {}; // name → id

  {
    // Sheet name has trailing space
    const sheetName = wb.SheetNames.find(n => n.trim() === 'TA Cliente') ?? 'TA Cliente ';
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn('Sheet not found: TA Cliente');
    } else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      // Row 0 is blank/metadata; row 1 is header; data starts at row 2
      const dataRows = rows.slice(2);

      const records = dataRows
        .filter(row => row[7] != null && String(row[7]).trim() !== '')
        .map(row => {
          const companyName = row[4] ? String(row[4]).trim() : null;
          const contractStart = typeof row[18] === 'number' ? excelDateToISO(row[18] as number) : null;
          const contractEnd = typeof row[19] === 'number' ? excelDateToISO(row[19] as number) : null;
          return {
            item: row[1] ? String(row[1]).trim() : null,
            uf: row[2] ? String(row[2]).trim() : null,
            status: row[3] ? String(row[3]).trim() : 'ATIVO',
            company_id: companyName ? (companyMap[companyName] ?? null) : null,
            year: row[5] ? Number(row[5]) : null,
            segment: row[6] ? String(row[6]).trim() : null,
            name: String(row[7]).trim(),
            razao_social: row[8] ? String(row[8]).trim() : null,
            cnpj: row[9] ? String(row[9]).trim() : null,
            inscricao: row[10] ? String(row[10]).trim() : null,
            city: row[11] ? String(row[11]).trim() : null,
            address: row[12] ? String(row[12]).trim() : null,
            cep: row[13] ? String(row[13]).trim() : null,
            tel: row[14] ? String(row[14]).trim() : null,
            responsible: row[15] ? String(row[15]).trim() : null,
            email: row[16] ? String(row[16]).trim() : null,
            contract_no: row[17] ? String(row[17]).trim() : null,
            contract_start: contractStart,
            contract_end: contractEnd,
            contract_object: row[20] ? String(row[20]).trim() : null,
            num_collaborators: row[21] != null ? Number(row[21]) : null,
            contract_value: row[22] != null ? Number(row[22]) : null,
            payment_day: null,
            payment_method: row[24] ? String(row[24]).trim() : null,
          };
        });

      if (records.length > 0) {
        // Deduplicate by company_id+name (safety net for any remaining unique constraint)
        const uniqueRecords = Object.values(
          Object.fromEntries(records.map(r => [`${String(r.company_id)}|${r.name}`, r]))
        );
        await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: insertError } = await supabase.from('clients').insert(uniqueRecords);
        if (insertError) console.error('Clients insert error:', insertError.message);
        else console.log(`  Inserted ${uniqueRecords.length} clients`);

        // Rebuild clientMap from DB (resilient to partial insert responses)
        const { data: allClients, error: selectError } = await supabase
          .from('clients')
          .select('id, name, company_id');
        if (selectError) {
          console.error('Clients select error:', selectError.message);
        } else {
          const companyNameById: Record<string, string> = Object.fromEntries(
            Object.entries(companyMap).map(([name, id]) => [id, name])
          );
          (allClients ?? []).forEach((c: { id: string; name: string; company_id: string | null }) => {
            clientMap[c.name] = c.id; // fallback: name-only key
            if (c.company_id) {
              const cn = companyNameById[c.company_id];
              if (cn) clientMap[`${cn}|${c.name}`] = c.id; // primary: company|name key
            }
          });
          console.log(`  clientMap populated with ${Object.keys(clientMap).length} entries`);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 4. Suppliers (TA Fornecedor)
  //    Cols: 0=ITEM, 1=EMPRESA, 2=FORNECEDOR, 3=RAZÃO SOCIAL, 4=CNPJ,
  //          5=CIDADE, 6=ENDEREÇO, 7=CEP, 8=TEL, 9=CT Nº,
  //          10=INICIO CONTRATO, 11=FIM CONTRATO, 12=STATUS, 13=VALOR,
  //          14=OBJETO, 15=VENCIMENTO
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Suppliers ---');
  const supplierMap: Record<string, string> = {}; // name → id

  {
    const sheetName = 'TA Fornecedor';
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      console.warn('Sheet not found:', sheetName);
    } else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const dataRows = rows.slice(1); // skip header

      const records = dataRows
        .filter(row => row[2] != null && String(row[2]).trim() !== '')
        .map(row => {
          const companyName = row[1] ? String(row[1]).trim() : null;
          const contractStart = typeof row[10] === 'number' ? excelDateToISO(row[10] as number) : null;
          const contractEnd = typeof row[11] === 'number' ? excelDateToISO(row[11] as number) : null;
          return {
            item: row[0] ? String(row[0]).trim() : null,
            company_id: companyName ? (companyMap[companyName] ?? null) : null,
            name: String(row[2]).trim(),
            razao_social: row[3] ? String(row[3]).trim() : null,
            cnpj: row[4] ? String(row[4]).trim() : null,
            city: row[5] ? String(row[5]).trim() : null,
            address: row[6] ? String(row[6]).trim() : null,
            cep: row[7] ? String(row[7]).trim() : null,
            tel: row[8] ? String(row[8]).trim() : null,
            contract_no: row[9] ? String(row[9]).trim() : null,
            contract_start: contractStart,
            contract_end: contractEnd,
            status: row[12] ? String(row[12]).trim() : 'ATIVO',
            value: row[13] != null ? Number(row[13]) : null,
            object: row[14] ? String(row[14]).trim() : null,
            due_day: row[15] != null ? Number(row[15]) : null,
          };
        });

      if (records.length > 0) {
        // Deduplicate by company_id+name
        const uniqueRecords = Object.values(
          Object.fromEntries(records.map(r => [`${String(r.company_id)}|${r.name}`, r]))
        );
        await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { data, error } = await supabase.from('suppliers').insert(uniqueRecords).select('id, name');
        if (error) console.error('Suppliers insert error:', error.message);
        else {
          (data ?? []).forEach((s: { id: string; name: string }) => {
            supplierMap[s.name] = s.id;
          });
          console.log(`  Upserted ${uniqueRecords.length} suppliers`);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Revenue transactions — sourced from monthly sheets (step 6 below)
  //    The 2026_RECEITA_* sheets are NOT used: they lack STATUS/payment data.
  //    Revenue rows are identified in monthly sheets by CONTA containing "RECEITA".
  // -----------------------------------------------------------------------
  console.log('\n--- Revenue transactions will be extracted from monthly sheets (step 6) ---');

  // Clear existing revenue_transactions before re-importing
  console.log('  Deleting existing revenue_transactions...');
  const { error: delRevErr } = await supabase
    .from('revenue_transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delRevErr) console.error('  Delete revenue_transactions error:', delRevErr.message);
  else console.log('  Existing revenue_transactions deleted.');

  // -----------------------------------------------------------------------
  // 6. Monthly sheets (JAN, FEV, ..., DEZ + 2026_MATRIZ_DESPESAS)
  //    Header row: index 4
  //    Cols: 0=COMPETÊNCIA, 1=CONTA, 2=CÓDIGO CONTABIL, 3=DESCRIÇÃO CONTABIL,
  //          4=EMPRESA, 5=CLIENTE, 6=TIPO DE DOCUMENTO, 7=Nº,
  //          8=FORNECEDOR, 9=DESCRIÇÃO, 10=PARC, 11=EMISSÃO,
  //          12=VENC., 13=PAGAMENTO, 14=STATUS,
  //          15=PRINCIPAL, 16=MULTA, 17=JUROS, 18=TOTAL
  //
  //    Rows where CONTA contains "RECEITA" → revenue_transactions
  //    All other rows                       → expense_transactions
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Monthly Transactions (Expenses + Revenues) ---');

  // Clear existing expense_transactions before re-importing
  console.log('  Deleting existing expense_transactions...');
  const { error: delExpErr } = await supabase
    .from('expense_transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (delExpErr) console.error('  Delete expense_transactions error:', delExpErr.message);
  else console.log('  Existing expense_transactions deleted.');

  const monthSheetNames = wb.SheetNames.filter(n =>
    Object.keys(MONTH_MAP).includes(n) || n === '2026_MATRIZ_DESPESAS'
  );

  let totalExpense = 0;
  let totalRevenue = 0;

  for (const sheetName of monthSheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Row 4 is header, data starts at row 5 (index 5)
    const dataRows = rows.slice(5);

    const expenseRecords: Record<string, unknown>[] = [];
    const revenueRecords: Record<string, unknown>[] = [];

    for (const row of dataRows) {
      // Skip rows where all key cells are null
      if (row[0] == null && row[1] == null && row[2] == null && row[15] == null) continue;

      const competencia = toCompetencia(row[0] as string | number | null);
      if (!competencia) continue;

      const principal = row[15] != null && typeof row[15] === 'number' ? row[15] : 0;
      // Skip rows with zero value that look like subtotal/separator rows
      if (principal === 0 && row[9] == null) continue;

      const conta = row[1] ? String(row[1]).trim().toUpperCase() : '';
      const isRevenue = conta.includes('RECEITA');

      const companyName = row[4] ? String(row[4]).trim() : null;
      const clientName = row[5] ? String(row[5]).trim() : null;
      const supplierName = row[8] ? String(row[8]).trim() : null;
      const accountCode = row[2] ? String(row[2]).trim() : null;

      const companyId = companyName ? (companyMap[companyName] ?? null) : null;
      const clientId = clientName
        ? (clientMap[`${companyName}|${clientName}`] ?? clientMap[clientName] ?? null)
        : null;
      if (clientName && !clientId) {
        console.warn(`  [WARN] client not found: company="${companyName}" client="${clientName}"`);
      }
      const supplierId = supplierName ? (supplierMap[supplierName] ?? null) : null;
      const accountId = accountCode ? (accountMap[accountCode] ?? null) : null;

      const issueDate = typeof row[11] === 'number' ? excelDateToISO(row[11] as number) : null;
      const dueDate = typeof row[12] === 'number' ? excelDateToISO(row[12] as number) : null;
      const paymentDate = typeof row[13] === 'number' ? excelDateToISO(row[13] as number) : null;
      const rawStatus = row[14] ? String(row[14]) : null;

      if (isRevenue) {
        revenueRecords.push({
          competencia,
          company_id: companyId,
          client_id: clientId,
          account_id: accountId,
          nf_number: row[7] != null ? String(row[7]).trim() : null,
          status: mapRevenueStatus(rawStatus),
          issue_date: issueDate,
          due_date: dueDate,
          payment_date: paymentDate,
          net_value: principal as number,
          // NF breakdown fields not available in monthly sheets — left null
        });
      } else {
        expenseRecords.push({
          competencia,
          account_id: accountId,
          company_id: companyId,
          client_id: clientId,
          supplier_id: supplierId,
          doc_type: row[6] ? String(row[6]).trim() : null,
          doc_number: row[7] != null ? String(row[7]).trim() : null,
          description: row[9] ? String(row[9]).trim() : null,
          installment: row[10] ? String(row[10]).trim() : null,
          issue_date: issueDate,
          due_date: dueDate,
          payment_date: paymentDate,
          status: mapExpenseStatus(rawStatus),
          principal: principal as number,
          fine: (row[16] != null && typeof row[16] === 'number' ? row[16] : 0) as number,
          interest: (row[17] != null && typeof row[17] === 'number' ? row[17] : 0) as number,
        });
      }
    }

    if (expenseRecords.length > 0) {
      const { error } = await supabase.from('expense_transactions').insert(expenseRecords);
      if (error) console.error(`Expenses [${sheetName}] insert error:`, error.message);
      else {
        totalExpense += expenseRecords.length;
        console.log(`  [${sheetName}] expenses: ${expenseRecords.length}, revenues: ${revenueRecords.length}`);
      }
    }

    if (revenueRecords.length > 0) {
      const { error } = await supabase.from('revenue_transactions').insert(revenueRecords);
      if (error) console.error(`Revenues [${sheetName}] insert error:`, error.message);
      else totalRevenue += revenueRecords.length;
    }
  }
  console.log(`  Total expense transactions: ${totalExpense}`);
  console.log(`  Total revenue transactions: ${totalRevenue}`);

  console.log('\nImport complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
