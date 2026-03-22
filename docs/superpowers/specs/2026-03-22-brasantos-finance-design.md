# Brasantos Finance — Design Spec

**Data:** 2026-03-22
**Status:** Aprovado pelo usuário

---

## 1. Contexto

A Brasantos Holding controla receitas e despesas de 3 empresas (BRASANTOS, JJB SERV, JJB ADM) atualmente em um arquivo Excel com abas mensais (JAN–DEZ), abas de receita por empresa, uma matriz de despesas recorrentes anuais e tabelas de cadastro. O objetivo é substituir esse Excel por um web app colaborativo, mobile-friendly e hospedado gratuitamente.

---

## 2. Requisitos levantados

| Requisito | Decisão |
|---|---|
| Usuários | 2–3 usuários internos (dono + assistente) |
| Escopo | Receitas + Despesas (completo) |
| Hosting | 100% gratuito |
| Dados históricos | Importação completa do Excel |
| GPS/reconciliação fiscal | Fora do escopo |
| Tela principal | Entrada rápida de lançamentos |
| Despesas recorrentes | Automáticas (cadastro único, geração automática) |
| Mobile | Responsivo mobile-first (prioridade) |
| Detalhe de NF | Completo: todos os campos de deduções e impostos |

---

## 3. Stack técnica

| Camada | Tecnologia | Hospedagem | Tier gratuito |
|---|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript | Vercel | Hobby (ilimitado) |
| UI | Tailwind CSS + shadcn/ui | — | — |
| Banco de dados | PostgreSQL | Supabase | 500 MB, 2 projetos |
| Autenticação | Supabase Auth (email + senha) | Supabase | Incluído |
| Storage | Supabase Storage (comprovantes) | Supabase | 1 GB |

**Observação sobre Supabase free tier:** projetos pausam após 1 semana sem acesso. Solução: configurar um cron job gratuito (ex: cron-job.org) que faz ping diário no endpoint da API.

---

## 4. Módulos e telas

### 4.1 Lançamentos (tela principal)

**Lista unificada** de despesas e receitas com:
- Filtros: empresa, mês/ano, tipo (despesa/receita), status, conta
- Ordenação por vencimento, valor, empresa
- Indicador visual de status: PAGO (verde), A PAGAR (amarelo), A RECEBER (azul), A VERIFICAR (cinza)

**Formulário de novo lançamento** (drawer/modal, mesmo formulário para mobile e desktop):
- Toggle no topo: **Despesa** | **Receita (NF)**
- **Campos de despesa** (mapeamento 1:1 do Excel):
  - Competência (MM/AAAA)
  - Conta (dropdown do plano de contas — ex: DESPESAS FIXAS)
  - Código contábil (auto-preenchido ao selecionar conta — ex: 20.02.001)
  - Descrição contábil (ex: ALUGUEL)
  - Empresa (BRASANTOS / JJB SERV / JJB ADM)
  - Cliente (dropdown dos clientes cadastrados)
  - Tipo de documento (BOLETO / FATURA / GFD / PIX / DAS / APÓLICE)
  - Nº do documento
  - Fornecedor (dropdown)
  - Descrição livre
  - Parcela (ex: 01/12)
  - Data de emissão
  - Data de vencimento
  - Data de pagamento
  - Status — válidos para despesas: **PAGO** / **A PAGAR** / **A VERIFICAR** (status "A RECEBER" não se aplica a despesas)
  - Principal (R$)
  - Multa (R$)
  - Juros (R$)
  - Total (calculado automaticamente)

- **Campos de receita (NF)** (mapeamento 1:1 do Excel):
  - Status — válidos para receitas: **RECEBIDO** / **A RECEBER** / **A VERIFICAR**
  - Data de emissão da NF
  - Data de vencimento (prazo de recebimento)
  - Data de recebimento
  - Competência (MM/AAAA)
  - Empresa
  - NF nº
  - Cliente (dropdown)
  - Valor total dos serviços
  - Materiais (R$)
  - Equipamentos (R$)
  - Vale Transporte 44h/s: qtde, valor unitário, dias, total
  - Vale Transporte 12×36: qtde, valor unitário, dias, total
  - Vale Alimentação 44h/s: qtde, valor unitário, dias, total
  - Vale Alimentação 12×36: qtde, valor unitário, dias, total
  - Uniforme 44h/s: qtde, valor unitário, ano, total
  - Uniforme 12×36: qtde, valor unitário, ano, total
  - Base de retenção INSS
  - Base de cálculo INSS
  - GPS 2632 (11%)
  - IRPJ 2089 (1%)
  - CSLL 2372 (1%)
  - COFINS 2172 (3%)
  - PIS 8109 (0,65%)
  - ISSQN 1732 (5%)
  - Total retenção NF
  - Valor líquido da NF (calculado)

### 4.2 Dashboard

- **Seletor de mês/ano** no topo
- **Cards individuais por empresa** (BRASANTOS, JJB SERV, JJB ADM): receita, despesa, saldo do mês
- **Card consolidado da holding**: receita total, despesa total, saldo total
- **Alerta de vencimentos próximos**: despesas com status A PAGAR e receitas com status A RECEBER cujo campo `due_date` cai nos próximos 7 dias a partir de hoje (nome, empresa, valor, data)
- Navegação rápida para lançamentos filtrados por empresa **e mês atual** ao clicar nos cards

### 4.3 Recorrentes (Matriz de Despesas)

Baseado na aba `2026_MATRIZ_DESPESAS` do Excel.

- **Lista de templates recorrentes** com: descrição, empresa, frequência, próximo vencimento, valor, status
- **Cadastro de template** com todos os campos de despesa + configuração de recorrência:
  - Frequência: mensal, anual, personalizada (N parcelas)
  - Dia de vencimento
  - Mês de início e fim (ou sem fim)
- **Geração automática via Vercel Cron Job** (gratuito no plano Hobby): um endpoint `/api/cron/generate-recurring` é chamado pelo Vercel no primeiro dia de cada mês (configurado em `vercel.json`). O endpoint verifica os templates ativos e insere os lançamentos pendentes do mês corrente caso ainda não existam (idempotente). O mesmo endpoint serve como keep-alive do Supabase (substituindo o ping separado mencionado na Seção 3).
- **Visualização**: lista dos lançamentos gerados por template com link para editar o lançamento gerado

### 4.4 Análise de Clientes

DRE por cliente com rateio de despesas indiretas.

**Definição de despesa direta vs. indireta:**
- **Despesa direta** = lançamento onde `client_id` aponta para um cliente real (segmento CONDOMINIO, EMPRESA, CONSTRUTORA)
- **Despesa indireta (overhead)** = lançamento onde o cliente cadastrado tem segmento **"ADM"** ou **"OPERACIONAL"** (clientes internos da TA Cliente, ex: item 08 "ADM" da BRASANTOS), ou onde `client_id` é null. O campo `clients.segment` distingue clientes reais de contas internas.

**Lógica de cálculo:**
- **Receita do cliente no mês** = soma de `revenue_transactions.net_value` onde `client_id = cliente`
- **Despesas diretas** = soma de `expense_transactions.total` onde `client_id = cliente`
- **Overhead do mês** = soma de `expense_transactions.total` onde `client.segment IN ('ADM', 'OPERACIONAL')` OR `client_id IS NULL`
- **Percentual de participação** = `receita_cliente / receita_total_holding_mês`
- **Despesa indireta rateada** = `overhead_mês × percentual_participação`
- **Resultado líquido** = `receita - despesas_diretas - despesas_indiretas`

**Aba 1 — Lista de clientes do mês:**
- Filtros: mês/ano, empresa
- Por cliente: receita, despesa direta, despesa indireta (rateada), resultado líquido, % participação na receita total, margem %
- Indicador visual: positivo (verde) / negativo (vermelho)
- Clique no cliente → detalhe expandido com breakdown linha a linha das despesas diretas e indiretas rateadas

**Aba 2 — Tabela cruzada:**
- Linhas: clientes ativos
- Colunas: meses do ano
- Célula: resultado líquido do cliente naquele mês
- Totalizadores por linha (acumulado anual) e por coluna (total holding no mês)

### 4.5 Relatórios

- **Relatório mensal por empresa**: receita × despesa × saldo
  - Breakdown de despesas agrupado por `chart_of_accounts.account` (nível 2, ex: DESPESAS FIXAS, ENCARGOS, SERVIÇOS DE TERCEIROS)
  - Breakdown de receitas agrupado por `chart_of_accounts.category = 'RECEITA'`
- Filtros: empresa (ou todas), período (mês único ou intervalo de meses)
- Exportação: CSV e PDF básico
- Visão comparativa mês a mês (gráfico de barras simples: receita vs despesa por mês)

### 4.6 Cadastros

Gestão das tabelas de referência:

| Entidade | Campos principais |
|---|---|
| Empresas | Nome, CNPJ, inscrição municipal, endereço, CEP |
| Clientes | Item, UF, status, empresa, segmento, razão social, CNPJ, endereço, contrato (nº, início, fim, objeto, qtde colaboradores, valor) |
| Fornecedores | Item, empresa, nome, razão social, CNPJ, endereço, contrato |
| Plano de contas | Código (10.xx receita / 20.xx despesa), conta, subconta, descrição, categoria |

---

## 5. Banco de dados — Schema

```sql
-- Empresas da holding
companies (id, name, cnpj, inscricao_municipal, address, cep, created_at)

-- Clientes
-- O campo `year` representa o ano de início do contrato (ex: 2025).
-- O campo `segment` distingue clientes reais ('CONDOMINIO', 'EMPRESA', 'CONSTRUTORA')
--   de contas internas ('ADM', 'OPERACIONAL', 'BANCO') usadas para categorizar despesas.
-- Clientes com segment IN ('ADM', 'OPERACIONAL') têm suas despesas tratadas como overhead
--   no cálculo de rateio da Análise de Clientes (Seção 4.4).
clients (id, item, uf, status, company_id, year, segment, name,
         razao_social, cnpj, inscricao, city, address, cep, tel,
         responsible, email, contract_no, contract_start, contract_end,
         contract_object, num_collaborators, contract_value, payment_day,
         payment_method, created_at)

-- Fornecedores
suppliers (id, item, company_id, name, razao_social, cnpj, city, address,
           cep, tel, contract_no, contract_start, contract_end, status,
           value, object, due_day, created_at)

-- Plano de contas gerencial
chart_of_accounts (id, code, account, sub_account, description,
                   category, -- 'RECEITA' | 'DESPESA'
                   created_at)

-- Lançamentos de despesa
-- O campo `installment` (ex: "01/12") é texto livre. Parcelas do mesmo contrato
-- são registros independentes sem vínculo entre si no MVP.
expense_transactions (
  id, competencia, account_id, company_id, client_id, supplier_id,
  doc_type, doc_number, description, installment,
  issue_date, due_date, payment_date, status,
  principal, fine, interest, total,
  recurring_template_id, -- null se não for de template
  created_by, created_at, updated_at
)

-- Cabeçalho da NF (receita)
revenue_transactions (
  id, competencia, company_id, client_id,
  nf_number,
  account_id, -- FK para chart_of_accounts; todas as NFs usam a conta RECEITA (10.01.001 ou 10.01.002)
  status, -- 'RECEBIDO' | 'A RECEBER' | 'A VERIFICAR'
  issue_date, due_date, payment_date,
  total_services, materials, equipment,
  -- VT 44h/s
  vt_44_qty, vt_44_unit, vt_44_days, vt_44_total,
  -- VT 12x36
  vt_12_qty, vt_12_unit, vt_12_days, vt_12_total,
  -- VA 44h/s
  va_44_qty, va_44_unit, va_44_days, va_44_total,
  -- VA 12x36
  va_12_qty, va_12_unit, va_12_days, va_12_total,
  -- Uniforme 44h/s
  unif_44_qty, unif_44_unit, unif_44_year, unif_44_total,
  -- Uniforme 12x36
  unif_12_qty, unif_12_unit, unif_12_year, unif_12_total,
  -- Retenções
  retention_base_inss, calc_base_inss,
  gps_2632, irpj_2089, csll_2372, cofins_2172, pis_8109, issqn_1732,
  total_retention, net_value,
  created_by, created_at, updated_at
)

-- Templates de despesa recorrente
recurring_templates (
  id, name, company_id, client_id, supplier_id, account_id,
  doc_type, description,
  frequency, -- 'monthly' | 'annual' | 'installments'
  due_day,      -- dia do mês do vencimento (ex: 10)
  due_month,    -- para frequency='annual': mês do ano do vencimento (1–12); null para mensais
  start_month,  -- YYYY-MM de início da geração
  end_month,    -- YYYY-MM de fim (null = sem fim, para mensais ativos indefinidamente)
  num_installments,   -- para frequency='installments': total de parcelas
  generated_count,    -- parcelas já geradas; cron para quando generated_count = num_installments
  value,
  active, created_at
)
-- Lógica do cron: para 'monthly', gera se não existe lançamento no mês atual.
-- Para 'annual', gera se MONTH(hoje) = due_month e não existe lançamento no ano atual.
-- Para 'installments', gera enquanto generated_count < num_installments e incrementa o contador.

-- Usuários (gerenciado pelo Supabase Auth)
-- profiles (id, email, name, created_at)
-- `id` é FK para `auth.users.id` (UUID do Supabase Auth)
-- Os campos `created_by` em expense_transactions e revenue_transactions são FK para `auth.users.id`
```

---

## 6. Navegação

**Desktop** — sidebar fixa à esquerda com 6 itens:
1. Lançamentos (ícone: lista)
2. Dashboard (ícone: gráfico)
3. Recorrentes (ícone: loop)
4. Análise de Clientes (ícone: pessoas)
5. Relatórios (ícone: documento)
6. Cadastros (ícone: banco de dados)

**Mobile** — bottom navigation bar com 4 ícones + menu "Mais":
1. Lançamentos
2. Dashboard
3. Análise de Clientes
4. Mais → (Recorrentes, Relatórios, Cadastros)

---

## 7. Migração de dados

Script de importação do Excel (`scripts/import-excel.ts`) executado uma única vez:

**Ordem de execução:**
1. `TA Empresa` → `companies`
2. `TA Fornecedor` → `suppliers`
3. `TA Gerencial` → `chart_of_accounts`
4. `TA Cliente` → `clients` (`year` = `YEAR(contract_start)`; quando `contract_start` é null, `year` = ano da coluna `ANO` da aba)
5. `2026_RECEITA_BRASANTOS` → `revenue_transactions` com `company_id = BRASANTOS`; `2026_RECEITA _JJB SERV` → `company_id = JJB SERV`; `2026_RECEITA_JJB ADM` → `company_id = JJB ADM` (company_id derivado do nome da aba). O script suporta múltiplos arquivos Excel de anos anteriores com o mesmo padrão de nomenclatura de abas.
6. Abas JAN–DEZ → `expense_transactions` (competência derivada do nome da aba + cabeçalho `ANO:`)
7. `2026_MATRIZ_DESPESAS` → `recurring_templates` (lançamentos com STATUS = 'MATRIZ' viram templates); lançamentos já pagos/a pagar dessa aba são importados como `expense_transactions` normais

---

## 8. Autenticação e segurança

- Login via Supabase Auth (email + senha)
- Row Level Security (RLS) habilitada no Supabase: políticas permitem acesso somente a usuários autenticados (sem multi-tenancy — todos os usuários compartilham os mesmos dados da holding)
- Sessão persistida via cookie (Next.js App Router + Supabase SSR)
- Sem papéis diferenciados no MVP (todos os 2–3 usuários têm acesso completo de leitura e escrita)

---

## 9. Fora do escopo (MVP)

- Cálculo e reconciliação de GPS
- Integração bancária (OFX/extratos)
- Aprovação de pagamentos / fluxo de trabalho
- App nativo (iOS/Android)
- Multi-tenant (outras holdings)
- Notificações push/email de vencimento
