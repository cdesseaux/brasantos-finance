-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read/write all data (single-tenant holding)
CREATE POLICY "authenticated_full_access" ON companies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON chart_of_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON suppliers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "own_profile" ON profiles
  FOR ALL TO authenticated USING (auth.uid() = id);

CREATE POLICY "authenticated_full_access" ON recurring_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON expense_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_full_access" ON revenue_transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Service role bypass (used by cron endpoint)
ALTER TABLE expense_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE recurring_templates FORCE ROW LEVEL SECURITY;
