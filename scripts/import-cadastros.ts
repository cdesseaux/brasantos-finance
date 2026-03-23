/**
 * Import reference tables only (companies, chart of accounts, clients, suppliers)
 * from the Excel file — does NOT touch transactions.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/import-cadastros.ts
 * Or:  npm run import:cadastros
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXCEL_PATH = path.resolve(__dirname, '..', 'Base_2026_ RECEITA X DESPESAS.xlsx');

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

function excelDateToISO(serial: number | null | undefined): string | null {
  if (!serial || typeof serial !== 'number') return null;
  const utc = (serial - 25569) * 86400 * 1000;
  const d = new Date(utc);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

async function main(): Promise<void> {
  console.log('Reading:', EXCEL_PATH);
  const wb = XLSX.readFile(EXCEL_PATH);
  const companyMap: Record<string, string> = {};

  // ── 1. Companies ──────────────────────────────────────────────────────────
  console.log('\n--- Companies ---');
  {
    const ws = wb.Sheets['TA Empresa'];
    if (!ws) { console.warn('Sheet not found: TA Empresa'); }
    else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const records = rows.slice(1)
        .filter(r => r[0] != null && String(r[0]).trim())
        .map(r => ({
          name:                 String(r[0]).trim(),
          cnpj:                 r[1] ? String(r[1]).trim() : null,
          inscricao_municipal:  r[2] ? String(r[2]).trim() : null,
          address:              r[3] ? String(r[3]).trim() : null,
          cep:                  r[4] ? String(r[4]).trim() : null,
        }));

      const { data, error } = await supabase
        .from('companies').upsert(records, { onConflict: 'name' }).select('id, name');
      if (error) console.error('Error:', error.message);
      else {
        (data ?? []).forEach((c: { id: string; name: string }) => { companyMap[c.name] = c.id; });
        console.log(`  ${records.length} empresas`);
      }
    }
  }

  // ── 2. Chart of accounts ──────────────────────────────────────────────────
  console.log('\n--- Plano de Contas ---');
  {
    const ws = wb.Sheets['TA Gerencial'];
    if (!ws) { console.warn('Sheet not found: TA Gerencial'); }
    else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const records = rows.slice(4)
        .filter(r => r[0] != null && String(r[0]).trim() && r[5] != null)
        .map(r => ({
          code:        String(r[0]).trim(),
          account:     r[1] ? String(r[1]).trim() : 'N/A',
          sub_account: r[2] ? String(r[2]).trim() : null,
          description: r[3] ? String(r[3]).trim() : String(r[0]).trim(),
          category:    CATEGORY_MAP[String(r[5] ?? '').trim()] ?? 'DESPESA',
        }));

      const { error } = await supabase
        .from('chart_of_accounts').upsert(records, { onConflict: 'code' });
      if (error) console.error('Error:', error.message);
      else console.log(`  ${records.length} contas`);
    }
  }

  // ── 3. Clients ────────────────────────────────────────────────────────────
  console.log('\n--- Clientes ---');
  {
    const sheetName = wb.SheetNames.find(n => n.trim() === 'TA Cliente') ?? 'TA Cliente ';
    const ws = wb.Sheets[sheetName];
    if (!ws) { console.warn('Sheet not found: TA Cliente'); }
    else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const records = rows.slice(2)
        .filter(r => r[7] != null && String(r[7]).trim())
        .map(r => {
          const companyName = r[4] ? String(r[4]).trim() : null;
          return {
            item:              r[1]  ? String(r[1]).trim() : null,
            uf:                r[2]  ? String(r[2]).trim() : null,
            status:            r[3]  ? String(r[3]).trim() : 'ATIVO',
            company_id:        companyName ? (companyMap[companyName] ?? null) : null,
            year:              r[5]  ? Number(r[5]) : null,
            segment:           r[6]  ? String(r[6]).trim() : null,
            name:              String(r[7]).trim(),
            razao_social:      r[8]  ? String(r[8]).trim() : null,
            cnpj:              r[9]  ? String(r[9]).trim() : null,
            inscricao:         r[10] ? String(r[10]).trim() : null,
            city:              r[11] ? String(r[11]).trim() : null,
            address:           r[12] ? String(r[12]).trim() : null,
            cep:               r[13] ? String(r[13]).trim() : null,
            tel:               r[14] ? String(r[14]).trim() : null,
            responsible:       r[15] ? String(r[15]).trim() : null,
            email:             r[16] ? String(r[16]).trim() : null,
            contract_no:       r[17] ? String(r[17]).trim() : null,
            contract_start:    typeof r[18] === 'number' ? excelDateToISO(r[18]) : null,
            contract_end:      typeof r[19] === 'number' ? excelDateToISO(r[19]) : null,
            contract_object:   r[20] ? String(r[20]).trim() : null,
            num_collaborators: r[21] != null ? Number(r[21]) : null,
            contract_value:    r[22] != null ? Number(r[22]) : null,
            payment_method:    r[24] ? String(r[24]).trim() : null,
          };
        });

      const uniqueClients = Object.values(
        Object.fromEntries(records.map(r => [r.name, r]))
      );
      await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { data, error } = await supabase.from('clients').insert(uniqueClients).select('id, name');
      if (error) console.error('Error:', error.message);
      else console.log(`  ${(data ?? []).length} clientes inseridos`);
    }
  }

  // ── 4. Suppliers ──────────────────────────────────────────────────────────
  console.log('\n--- Fornecedores ---');
  {
    const ws = wb.Sheets['TA Fornecedor'];
    if (!ws) { console.warn('Sheet not found: TA Fornecedor'); }
    else {
      const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const records = rows.slice(1)
        .filter(r => r[2] != null && String(r[2]).trim())
        .map(r => {
          const companyName = r[1] ? String(r[1]).trim() : null;
          return {
            item:           r[0]  ? String(r[0]).trim() : null,
            company_id:     companyName ? (companyMap[companyName] ?? null) : null,
            name:           String(r[2]).trim(),
            razao_social:   r[3]  ? String(r[3]).trim() : null,
            cnpj:           r[4]  ? String(r[4]).trim() : null,
            city:           r[5]  ? String(r[5]).trim() : null,
            address:        r[6]  ? String(r[6]).trim() : null,
            cep:            r[7]  ? String(r[7]).trim() : null,
            tel:            r[8]  ? String(r[8]).trim() : null,
            contract_no:    r[9]  ? String(r[9]).trim() : null,
            contract_start: typeof r[10] === 'number' ? excelDateToISO(r[10]) : null,
            contract_end:   typeof r[11] === 'number' ? excelDateToISO(r[11]) : null,
            status:         r[12] ? String(r[12]).trim() : 'ATIVO',
            value:          r[13] != null ? Number(r[13]) : null,
            object:         r[14] ? String(r[14]).trim() : null,
            due_day:        r[15] != null ? Number(r[15]) : null,
          };
        });

      const uniqueSuppliers = Object.values(
        Object.fromEntries(records.map(r => [r.name, r]))
      );
      await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { data, error } = await supabase.from('suppliers').insert(uniqueSuppliers).select('id, name');
      if (error) console.error('Error:', error.message);
      else console.log(`  ${(data ?? []).length} fornecedores inseridos`);
    }
  }

  console.log('\nCadastros import complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
