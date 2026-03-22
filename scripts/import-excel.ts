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
function mapRevenueStatus(raw: string | null | undefined): 'RECEBIDO' | 'A RECEBER' | 'A VERIFICAR' {
  const s = (raw ?? '').trim().toUpperCase();
  if (s === 'RECEBIDO') return 'RECEBIDO';
  if (s === 'A RECEBER') return 'A RECEBER';
  return 'A RECEBER'; // default for revenue
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
        const { data, error } = await supabase
          .from('clients')
          .upsert(records, { onConflict: 'name' })
          .select('id, name');
        if (error) console.error('Clients upsert error:', error.message);
        else {
          (data ?? []).forEach((c: { id: string; name: string }) => {
            clientMap[c.name] = c.id;
          });
          console.log(`  Upserted ${records.length} clients`);
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
        const { data, error } = await supabase
          .from('suppliers')
          .upsert(records, { onConflict: 'name' })
          .select('id, name');
        if (error) console.error('Suppliers upsert error:', error.message);
        else {
          (data ?? []).forEach((s: { id: string; name: string }) => {
            supplierMap[s.name] = s.id;
          });
          console.log(`  Upserted ${records.length} suppliers`);
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // 5. Revenue transactions (2026_RECEITA_* sheets)
  //    Data starts at row index 16 (rows 0-12 are metadata/headers).
  //    Cols: 0=COMP, 1=NF, 2=CLIENTE, 3=VALOR TOTAL,
  //          4=MATERIAS, 5=EQUIPAMENTOS,
  //          6=VT44_QTY, 7=VT44_UNIT, 8=VT44_DAYS, 9=VT44_TOTAL,
  //          10=VT12_QTY, 11=VT12_UNIT, 12=VT12_DAYS, 13=VT12_TOTAL,
  //          14=VT_TOTAL (skip - not in schema),
  //          15=VA44_QTY, 16=VA44_UNIT, 17=VA44_DAYS, 18=VA44_TOTAL,
  //          19=VA12_QTY, 20=VA12_UNIT, 21=VA12_DAYS, 22=VA12_TOTAL,
  //          23=VA_TOTAL (skip),
  //          24=UNIF44_QTY, 25=UNIF44_UNIT, 26=UNIF44_YEAR, 27=UNIF44_TOTAL,
  //          28=UNIF12_QTY, 29=UNIF12_UNIT, 30=UNIF12_YEAR, 31=UNIF12_TOTAL,
  //          32=UNIF_TOTAL (skip),
  //          33=RETENTION_BASE_INSS, 34=CALC_BASE_INSS,
  //          35=GPS_2632(RETENÇÃO), 36=IRPJ_2089, 37=CSLL_2372,
  //          38=COFINS_2172, 39=PIS_8109, 40=ISSQN_1732,
  //          41=TOTAL_RETENTION, 42=TOTAL_RETENÇÃO_NF (skip),
  //          43=NET_VALUE
  //    Revenue sheet name contains company name: extract from it.
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Revenue Transactions ---');

  const revenueSheets = wb.SheetNames.filter(n => n.includes('RECEITA'));
  let totalRevenue = 0;

  for (const sheetName of revenueSheets) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    // Derive company name from sheet: '2026_RECEITA_BRASANTOS' → 'BRASANTOS'
    //  '2026_RECEITA _JJB SERV' → 'JJB SERV'
    //  '2026_RECEITA_JJB ADM' → 'JJB ADM'
    const companyFromSheet = sheetName.replace(/^2026_RECEITA\s*_\s*/i, '').trim();
    const companyId = companyMap[companyFromSheet] ?? null;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Data rows start at index 16 (0-indexed)
    const dataRows = rows.slice(16);

    const records: Record<string, unknown>[] = [];

    for (const row of dataRows) {
      // Skip blank rows
      if (row[0] == null && row[1] == null && row[2] == null) continue;

      const competencia = toCompetencia(row[0] as string | number | null);
      if (!competencia) continue;

      const clientName = row[2] ? String(row[2]).trim() : null;
      if (!clientName) continue;

      const clientId = clientName ? (clientMap[clientName] ?? null) : null;
      const nfNumber = row[1] != null ? String(row[1]).trim() : null;

      const n = (v: unknown): number => (v != null && typeof v === 'number' ? v : 0);

      records.push({
        competencia,
        company_id: companyId,
        client_id: clientId,
        account_id: null, // revenue account not directly specified per-row
        nf_number: nfNumber,
        status: mapRevenueStatus(null), // no status column in revenue sheet — default A RECEBER
        total_services: n(row[3]),
        materials: n(row[4]),
        equipment: n(row[5]),
        vt_44_qty: Math.round(n(row[6])),
        vt_44_unit: n(row[7]),
        vt_44_days: Math.round(n(row[8])),
        vt_44_total: n(row[9]),
        vt_12_qty: Math.round(n(row[10])),
        vt_12_unit: n(row[11]),
        vt_12_days: Math.round(n(row[12])),
        vt_12_total: n(row[13]),
        va_44_qty: Math.round(n(row[15])),
        va_44_unit: n(row[16]),
        va_44_days: Math.round(n(row[17])),
        va_44_total: n(row[18]),
        va_12_qty: Math.round(n(row[19])),
        va_12_unit: n(row[20]),
        va_12_days: Math.round(n(row[21])),
        va_12_total: n(row[22]),
        unif_44_qty: Math.round(n(row[24])),
        unif_44_unit: n(row[25]),
        unif_44_year: Math.round(n(row[26])),
        unif_44_total: n(row[27]),
        unif_12_qty: Math.round(n(row[28])),
        unif_12_unit: n(row[29]),
        unif_12_year: Math.round(n(row[30])),
        unif_12_total: n(row[31]),
        retention_base_inss: n(row[33]),
        calc_base_inss: n(row[34]),
        gps_2632: n(row[35]),
        irpj_2089: n(row[36]),
        csll_2372: n(row[37]),
        cofins_2172: n(row[38]),
        pis_8109: n(row[39]),
        issqn_1732: n(row[40]),
        total_retention: n(row[41]),
        net_value: n(row[43]),
      });
    }

    if (records.length > 0) {
      // revenue_transactions has no unique constraint suitable for upsert;
      // use insert with ignoreDuplicates=false — run is idempotent via truncate+insert pattern,
      // but since we can't truncate safely, use insert (script is meant to run once).
      const { error } = await supabase
        .from('revenue_transactions')
        .insert(records);
      if (error) console.error(`Revenue [${sheetName}] insert error:`, error.message);
      else {
        totalRevenue += records.length;
        console.log(`  [${sheetName}] inserted ${records.length} revenue transactions`);
      }
    }
  }
  console.log(`  Total revenue transactions inserted: ${totalRevenue}`);

  // -----------------------------------------------------------------------
  // 6. Expense transactions (monthly sheets: JAN, FEV, ..., DEZ)
  //    Also includes 2026_MATRIZ_DESPESAS (same structure, month=FEV/MAR).
  //    Header row: index 4
  //    Cols: 0=COMPETÊNCIA, 1=CONTA, 2=CÓDIGO CONTABIL, 3=DESCRIÇÃO CONTABIL,
  //          4=EMPRESA, 5=CLIENTE, 6=TIPO DE DOCUMENTO, 7=Nº,
  //          8=FORNECEDOR, 9=DESCRIÇÃO, 10=PARC, 11=EMISSÃO,
  //          12=VENC., 13=PAGAMENTO, 14=STATUS,
  //          15=PRINCIPAL, 16=MULTA, 17=JUROS, 18=TOTAL
  // -----------------------------------------------------------------------
  console.log('\n--- Importing Expense Transactions ---');

  const monthSheetNames = wb.SheetNames.filter(n =>
    Object.keys(MONTH_MAP).includes(n) || n === '2026_MATRIZ_DESPESAS'
  );

  let totalExpense = 0;

  for (const sheetName of monthSheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    // Row 4 is header, data starts at row 5 (index 5)
    const dataRows = rows.slice(5);

    const records: Record<string, unknown>[] = [];

    for (const row of dataRows) {
      // Skip rows where all key cells are null
      if (row[0] == null && row[1] == null && row[2] == null && row[15] == null) continue;

      const competencia = toCompetencia(row[0] as string | number | null);
      if (!competencia) continue;

      const principal = row[15] != null && typeof row[15] === 'number' ? row[15] : 0;
      // Skip rows with zero value that look like subtotal/separator rows
      if (principal === 0 && row[9] == null) continue;

      const companyName = row[4] ? String(row[4]).trim() : null;
      const clientName = row[5] ? String(row[5]).trim() : null;
      const supplierName = row[8] ? String(row[8]).trim() : null;
      const accountCode = row[2] ? String(row[2]).trim() : null;

      const companyId = companyName ? (companyMap[companyName] ?? null) : null;
      const clientId = clientName ? (clientMap[clientName] ?? null) : null;
      const supplierId = supplierName ? (supplierMap[supplierName] ?? null) : null;
      const accountId = accountCode ? (accountMap[accountCode] ?? null) : null;

      const issueDate = typeof row[11] === 'number' ? excelDateToISO(row[11] as number) : null;
      const dueDate = typeof row[12] === 'number' ? excelDateToISO(row[12] as number) : null;
      const paymentDate = typeof row[13] === 'number' ? excelDateToISO(row[13] as number) : null;

      const rawStatus = row[14] ? String(row[14]) : null;
      const status = mapExpenseStatus(rawStatus);

      records.push({
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
        status,
        principal: principal as number,
        fine: (row[16] != null && typeof row[16] === 'number' ? row[16] : 0) as number,
        interest: (row[17] != null && typeof row[17] === 'number' ? row[17] : 0) as number,
      });
    }

    if (records.length > 0) {
      const { error } = await supabase
        .from('expense_transactions')
        .insert(records);
      if (error) console.error(`Expenses [${sheetName}] insert error:`, error.message);
      else {
        totalExpense += records.length;
        console.log(`  [${sheetName}] inserted ${records.length} expense transactions`);
      }
    }
  }
  console.log(`  Total expense transactions inserted: ${totalExpense}`);

  console.log('\nImport complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
