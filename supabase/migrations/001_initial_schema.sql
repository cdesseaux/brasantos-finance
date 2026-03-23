-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  cnpj text,
  inscricao_municipal text,
  address text,
  cep text,
  created_at timestamptz DEFAULT now()
);

-- Chart of accounts (Plano de Contas Gerencial)
CREATE TABLE chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  account text NOT NULL,
  sub_account text,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('RECEITA', 'DESPESA',
    'DESPESAS BANCÁRIAS', 'DESPESAS FIXAS', 'ENCARGOS',
    'FOLHA DE PAGAMENTO', 'SERVIÇOS DE TERCEIROS', 'TRIBUTOS')),
  created_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text,
  uf text,
  status text DEFAULT 'ATIVO',
  company_id uuid REFERENCES companies(id),
  year integer,
  segment text,  -- 'CONDOMINIO' | 'EMPRESA' | 'CONSTRUTORA' | 'ADM' | 'OPERACIONAL' | 'BANCO'
  name text NOT NULL,
  razao_social text,
  cnpj text,
  inscricao text,
  city text,
  address text,
  cep text,
  tel text,
  responsible text,
  email text,
  contract_no text,
  contract_start date,
  contract_end date,
  contract_object text,
  num_collaborators integer,
  contract_value numeric(12,2),
  payment_day integer,
  payment_method text,
  created_at timestamptz DEFAULT now()
);

-- Suppliers
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text,
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  razao_social text,
  cnpj text,
  city text,
  address text,
  cep text,
  tel text,
  contract_no text,
  contract_start date,
  contract_end date,
  status text DEFAULT 'ATIVO',
  value numeric(12,2),
  object text,
  due_day integer,
  created_at timestamptz DEFAULT now()
);

-- Profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Recurring expense templates
CREATE TABLE recurring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  supplier_id uuid REFERENCES suppliers(id),
  account_id uuid REFERENCES chart_of_accounts(id),
  doc_type text,
  description text,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'annual', 'installments')),
  due_day integer NOT NULL,
  due_month integer CHECK (due_month BETWEEN 1 AND 12),
  start_month text NOT NULL,  -- YYYY-MM
  end_month text,             -- YYYY-MM or null
  num_installments integer,
  generated_count integer DEFAULT 0,
  value numeric(12,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Expense transactions
CREATE TABLE expense_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia text NOT NULL,  -- YYYY-MM (e.g. '2026-01')
  account_id uuid REFERENCES chart_of_accounts(id),
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  supplier_id uuid REFERENCES suppliers(id),
  doc_type text,
  doc_number text,
  description text,
  installment text,
  issue_date date,
  due_date date,
  payment_date date,
  status text NOT NULL DEFAULT 'A PAGAR'
    CHECK (status IN ('PAGO', 'A PAGAR', 'A VERIFICAR')),
  principal numeric(12,2) NOT NULL DEFAULT 0,
  fine numeric(12,2) NOT NULL DEFAULT 0,
  interest numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (principal + fine + interest) STORED,
  recurring_template_id uuid REFERENCES recurring_templates(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Revenue transactions (NF)
CREATE TABLE revenue_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competencia text NOT NULL,  -- YYYY-MM (e.g. '2026-01')
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  account_id uuid REFERENCES chart_of_accounts(id),
  nf_number text,
  status text NOT NULL DEFAULT 'A RECEBER'
    CHECK (status IN ('RECEBIDO', 'A RECEBER', 'A VERIFICAR')),
  issue_date date,
  due_date date,
  payment_date date,
  total_services numeric(12,2) DEFAULT 0,
  materials numeric(12,2) DEFAULT 0,
  equipment numeric(12,2) DEFAULT 0,
  vt_44_qty integer DEFAULT 0,
  vt_44_unit numeric(10,2) DEFAULT 0,
  vt_44_days integer DEFAULT 0,
  vt_44_total numeric(12,2) DEFAULT 0,
  vt_12_qty integer DEFAULT 0,
  vt_12_unit numeric(10,2) DEFAULT 0,
  vt_12_days integer DEFAULT 0,
  vt_12_total numeric(12,2) DEFAULT 0,
  va_44_qty integer DEFAULT 0,
  va_44_unit numeric(10,2) DEFAULT 0,
  va_44_days integer DEFAULT 0,
  va_44_total numeric(12,2) DEFAULT 0,
  va_12_qty integer DEFAULT 0,
  va_12_unit numeric(10,2) DEFAULT 0,
  va_12_days integer DEFAULT 0,
  va_12_total numeric(12,2) DEFAULT 0,
  unif_44_qty integer DEFAULT 0,
  unif_44_unit numeric(10,2) DEFAULT 0,
  unif_44_year integer DEFAULT 0,
  unif_44_total numeric(12,2) DEFAULT 0,
  unif_12_qty integer DEFAULT 0,
  unif_12_unit numeric(10,2) DEFAULT 0,
  unif_12_year integer DEFAULT 0,
  unif_12_total numeric(12,2) DEFAULT 0,
  retention_base_inss numeric(12,2) DEFAULT 0,
  calc_base_inss numeric(12,2) DEFAULT 0,
  gps_2632 numeric(12,2) DEFAULT 0,
  irpj_2089 numeric(12,2) DEFAULT 0,
  csll_2372 numeric(12,2) DEFAULT 0,
  cofins_2172 numeric(12,2) DEFAULT 0,
  pis_8109 numeric(12,2) DEFAULT 0,
  issqn_1732 numeric(12,2) DEFAULT 0,
  total_retention numeric(12,2) DEFAULT 0,
  net_value numeric(12,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_expense_competencia ON expense_transactions(competencia);
CREATE INDEX idx_expense_company ON expense_transactions(company_id);
CREATE INDEX idx_expense_client ON expense_transactions(client_id);
CREATE INDEX idx_expense_due_date ON expense_transactions(due_date);
CREATE INDEX idx_revenue_competencia ON revenue_transactions(competencia);
CREATE INDEX idx_revenue_company ON revenue_transactions(company_id);
CREATE INDEX idx_revenue_client ON revenue_transactions(client_id);
CREATE INDEX idx_revenue_due_date ON revenue_transactions(due_date);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expense_updated_at BEFORE UPDATE ON expense_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER revenue_updated_at BEFORE UPDATE ON revenue_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles(id, email) VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
