# Brasantos Finance — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack web app (Next.js 14 + Supabase) to replace an Excel-based financial control system for a holding company with 3 companies, covering expense/revenue entry, dashboard, recurring templates, client P&L analysis, reports, and Excel data migration.

**Architecture:** Next.js 14 App Router with TypeScript and Tailwind CSS for the frontend deployed on Vercel; Supabase (PostgreSQL + Auth + Storage) for the backend. Data mutations use Server Actions; data fetching uses async Server Components. RLS on Supabase enforces authentication gate (single-tenant, all users share data).

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · shadcn/ui · Supabase (PostgreSQL + Auth) · Zod · React Hook Form · Recharts · date-fns · xlsx (migration script)

**Spec:** `docs/superpowers/specs/2026-03-22-brasantos-finance-design.md`

---

## File Map

```
brasantos_finance/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login page
│   │   └── layout.tsx                # Unauthenticated layout
│   ├── (app)/
│   │   ├── layout.tsx                # Sidebar + bottom nav shell
│   │   ├── lancamentos/page.tsx      # Main transaction list
│   │   ├── dashboard/page.tsx        # Company cards + alerts
│   │   ├── recorrentes/page.tsx      # Recurring templates list
│   │   ├── analise/page.tsx          # Client DRE (list + cross-table tabs)
│   │   ├── relatorios/page.tsx       # Monthly reports + export
│   │   └── cadastros/
│   │       ├── empresas/page.tsx
│   │       ├── clientes/page.tsx
│   │       ├── fornecedores/page.tsx
│   │       └── plano-de-contas/page.tsx
│   ├── api/cron/generate-recurring/route.ts  # Vercel cron endpoint
│   ├── globals.css
│   ├── layout.tsx                    # Root layout
│   └── middleware.ts                 # Supabase session refresh
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── bottom-nav.tsx
│   ├── lancamentos/
│   │   ├── transaction-list.tsx      # Filterable list
│   │   ├── transaction-drawer.tsx    # Drawer shell (toggle Despesa/Receita)
│   │   ├── expense-form.tsx          # All expense fields
│   │   └── revenue-form.tsx          # All NF fields
│   ├── dashboard/
│   │   ├── company-card.tsx
│   │   ├── holding-summary.tsx
│   │   └── due-alerts.tsx
│   ├── analise/
│   │   ├── client-dre-list.tsx
│   │   ├── client-dre-detail.tsx
│   │   └── client-cross-table.tsx
│   ├── relatorios/
│   │   ├── monthly-report.tsx
│   │   └── revenue-expense-chart.tsx
│   └── ui/                           # shadcn/ui components (auto-generated)
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server component client
│   │   └── middleware.ts             # Session refresh helper
│   ├── db/
│   │   ├── companies.ts              # CRUD queries
│   │   ├── clients.ts
│   │   ├── suppliers.ts
│   │   ├── chart-of-accounts.ts
│   │   ├── expense-transactions.ts
│   │   ├── revenue-transactions.ts
│   │   ├── recurring-templates.ts
│   │   └── analytics.ts             # Cost allocation + DRE queries
│   └── utils/
│       ├── currency.ts               # Format BRL
│       ├── date.ts                   # Competência helpers
│       └── allocation.ts             # Client DRE calculation logic
├── types/
│   └── database.ts                   # Supabase generated types
├── schemas/
│   ├── expense.ts                    # Zod schema for expense form
│   └── revenue.ts                    # Zod schema for revenue form
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_rls_policies.sql
├── scripts/
│   └── import-excel.ts               # One-time migration
├── __tests__/
│   ├── utils/currency.test.ts
│   ├── utils/allocation.test.ts
│   └── api/generate-recurring.test.ts
├── vercel.json                        # Cron config
├── next.config.ts
└── package.json
```

---

## Phase 1 — Foundation

### Task 1: Project setup

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`
- Create: `.env.local` (from `.env.example`)
- Create: `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Bootstrap Next.js project**

```bash
cd c:/Users/User/projetos/brasantos_finance
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Choose: No to `src/` directory, Yes to App Router.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install date-fns
npm install recharts
npm install -D @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Choose: Default style, Slate base color, CSS variables: Yes.

- [ ] **Step 4: Add core shadcn components**

```bash
npx shadcn@latest add button input label select textarea form card badge table tabs drawer dialog alert
```

- [ ] **Step 5: Create `.env.example`**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-secret
```

Copy to `.env.local` and fill with Supabase project values from https://app.supabase.com.

- [ ] **Step 6: Create Supabase client helpers**

`lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`lib/supabase/server.ts`:
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 7: Create middleware**

`middleware.ts` (root level):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js starts on http://localhost:3000 without errors.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: bootstrap Next.js 14 + Supabase + shadcn/ui"
```

---

### Task 2: Database schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

`YOUR_PROJECT_REF` is from the Supabase dashboard URL: `app.supabase.com/project/YOUR_PROJECT_REF`.

- [ ] **Step 2: Create migration file**

`supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  cnpj text,
  inscricao_municipal text,
  address text,
  cep text,
  created_at timestamptz DEFAULT now()
);

-- Chart of accounts (Plano de Contas Gerencial)
CREATE TABLE chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  supplier_id uuid REFERENCES suppliers(id),
  account_id uuid REFERENCES chart_of_accounts(id),
  doc_type text,
  description text,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'annual', 'installments')),
  due_day integer NOT NULL,
  due_month integer CHECK (due_month BETWEEN 1 AND 12),  -- for annual only
  start_month text NOT NULL,  -- YYYY-MM
  end_month text,             -- YYYY-MM or null
  num_installments integer,   -- for installments only
  generated_count integer DEFAULT 0,
  value numeric(12,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Expense transactions
CREATE TABLE expense_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  competencia text NOT NULL,  -- MM/YY (e.g. '1/26')
  account_id uuid REFERENCES chart_of_accounts(id),
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  supplier_id uuid REFERENCES suppliers(id),
  doc_type text,
  doc_number text,
  description text,
  installment text,  -- free text, e.g. '01/12'
  issue_date date,
  due_date date,
  payment_date date,
  status text NOT NULL DEFAULT 'A PAGAR'
    CHECK (status IN ('PAGO', 'A PAGAR', 'A VERIFICAR')),
  principal numeric(12,2) DEFAULT 0,
  fine numeric(12,2) DEFAULT 0,
  interest numeric(12,2) DEFAULT 0,
  total numeric(12,2) GENERATED ALWAYS AS (principal + fine + interest) STORED,
  recurring_template_id uuid REFERENCES recurring_templates(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Revenue transactions (NF)
CREATE TABLE revenue_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  competencia text NOT NULL,
  company_id uuid REFERENCES companies(id),
  client_id uuid REFERENCES clients(id),
  account_id uuid REFERENCES chart_of_accounts(id),
  nf_number text,
  status text NOT NULL DEFAULT 'A RECEBER'
    CHECK (status IN ('RECEBIDO', 'A RECEBER', 'A VERIFICAR')),
  issue_date date,
  due_date date,
  payment_date date,
  -- Service value
  total_services numeric(12,2) DEFAULT 0,
  materials numeric(12,2) DEFAULT 0,
  equipment numeric(12,2) DEFAULT 0,
  -- VT 44h/s
  vt_44_qty integer DEFAULT 0,
  vt_44_unit numeric(10,2) DEFAULT 0,
  vt_44_days integer DEFAULT 0,
  vt_44_total numeric(12,2) DEFAULT 0,
  -- VT 12x36
  vt_12_qty integer DEFAULT 0,
  vt_12_unit numeric(10,2) DEFAULT 0,
  vt_12_days integer DEFAULT 0,
  vt_12_total numeric(12,2) DEFAULT 0,
  -- VA 44h/s
  va_44_qty integer DEFAULT 0,
  va_44_unit numeric(10,2) DEFAULT 0,
  va_44_days integer DEFAULT 0,
  va_44_total numeric(12,2) DEFAULT 0,
  -- VA 12x36
  va_12_qty integer DEFAULT 0,
  va_12_unit numeric(10,2) DEFAULT 0,
  va_12_days integer DEFAULT 0,
  va_12_total numeric(12,2) DEFAULT 0,
  -- Uniforme 44h/s
  unif_44_qty integer DEFAULT 0,
  unif_44_unit numeric(10,2) DEFAULT 0,
  unif_44_year integer DEFAULT 0,
  unif_44_total numeric(12,2) DEFAULT 0,
  -- Uniforme 12x36
  unif_12_qty integer DEFAULT 0,
  unif_12_unit numeric(10,2) DEFAULT 0,
  unif_12_year integer DEFAULT 0,
  unif_12_total numeric(12,2) DEFAULT 0,
  -- Tax retention
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

- [ ] **Step 3: Apply migration**

```bash
supabase db push
```

Expected: All tables created without errors.

- [ ] **Step 4: Generate TypeScript types**

```bash
supabase gen types typescript --linked > types/database.ts
```

- [ ] **Step 5: Commit**

```bash
git add supabase/ types/
git commit -m "feat: database schema with all tables and indexes"
```

---

### Task 3: RLS policies

**Files:**
- Create: `supabase/migrations/002_rls_policies.sql`

- [ ] **Step 1: Create RLS migration**

`supabase/migrations/002_rls_policies.sql`:
```sql
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
```

- [ ] **Step 2: Apply migration**

```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_rls_policies.sql
git commit -m "feat: RLS policies — authenticated full access, single-tenant"
```

---

### Task 4: Authentication

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(app)/layout.tsx` (shell, expanded in Task 5)

- [ ] **Step 1: Create auth layout**

`app/(auth)/layout.tsx`:
```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Create login page**

`app/(auth)/login/page.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
    } else {
      router.push('/lancamentos')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Brasantos Finance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

Fix the password `onChange` — it should use `setPassword`, not `setEmail`:
```typescript
onChange={e => setPassword(e.target.value)}
```

- [ ] **Step 3: Create first app user in Supabase dashboard**

Go to Supabase Dashboard → Authentication → Users → Add user. Enter your email and password.

- [ ] **Step 4: Test login flow manually**

```bash
npm run dev
```

Open http://localhost:3000 — should redirect to `/login`. Enter credentials. Should redirect to `/lancamentos` (will 404 for now, that's OK).

- [ ] **Step 5: Commit**

```bash
git add app/
git commit -m "feat: login page with Supabase Auth + middleware redirect"
```

---

### Task 5: App layout — sidebar and bottom nav

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/bottom-nav.tsx`
- Create: `app/(app)/lancamentos/page.tsx` (placeholder)

- [ ] **Step 1: Create sidebar component**

`components/layout/sidebar.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  List, LayoutDashboard, RefreshCw, Users, FileText, Database, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/lancamentos', label: 'Lançamentos', icon: List },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recorrentes', label: 'Recorrentes', icon: RefreshCw },
  { href: '/analise', label: 'Análise de Clientes', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/cadastros/empresas', label: 'Cadastros', icon: Database },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-slate-900 text-slate-300">
      <div className="p-4 font-bold text-white text-sm border-b border-slate-700">
        💼 Brasantos Finance
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 hover:text-white'
            )}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <button onClick={handleLogout}
        className="flex items-center gap-3 px-5 py-3 text-sm text-slate-400 hover:text-white border-t border-slate-700">
        <LogOut size={16} /> Sair
      </button>
    </aside>
  )
}
```

- [ ] **Step 2: Create bottom nav component**

`components/layout/bottom-nav.tsx`:
```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { List, LayoutDashboard, Users, MoreHorizontal } from 'lucide-react'

const mainItems = [
  { href: '/lancamentos', label: 'Lançamentos', icon: List },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analise', label: 'Análise', icon: Users },
  { href: '/cadastros/empresas', label: 'Mais', icon: MoreHorizontal },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex z-50">
      {mainItems.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href}
          className={cn(
            'flex-1 flex flex-col items-center py-2 text-xs gap-1',
            pathname.startsWith(href) ? 'text-blue-600' : 'text-slate-500'
          )}>
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Create app layout**

`app/(app)/layout.tsx`:
```typescript
import { Sidebar } from '@/components/layout/sidebar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Create placeholder landing page**

`app/(app)/lancamentos/page.tsx`:
```typescript
export default function LancamentosPage() {
  return <div className="p-6"><h1 className="text-2xl font-bold">Lançamentos</h1></div>
}
```

Also create placeholder `page.tsx` for: `dashboard`, `recorrentes`, `analise`, `relatorios`, `cadastros/empresas`, `cadastros/clientes`, `cadastros/fornecedores`, `cadastros/plano-de-contas` — all with the same pattern.

- [ ] **Step 5: Add redirect from root**

`app/page.tsx`:
```typescript
import { redirect } from 'next/navigation'
export default function RootPage() {
  redirect('/lancamentos')
}
```

- [ ] **Step 6: Verify navigation renders**

```bash
npm run dev
```

Log in → should see sidebar on desktop, bottom nav on mobile, navigate between pages.

- [ ] **Step 7: Commit**

```bash
git add app/ components/layout/
git commit -m "feat: app layout with sidebar (desktop) and bottom nav (mobile)"
```

---

## Phase 2 — Utilities and Reference Data

### Task 6: Utility functions

**Files:**
- Create: `lib/utils/currency.ts`
- Create: `lib/utils/date.ts`
- Create: `lib/utils/allocation.ts`
- Create: `__tests__/utils/currency.test.ts`
- Create: `__tests__/utils/allocation.test.ts`

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

`jest.config.ts`:
```typescript
import type { Config } from 'jest'
const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}
export default config
```

Add to `package.json` scripts: `"test": "jest"`.

- [ ] **Step 2: Write failing currency tests**

`__tests__/utils/currency.test.ts`:
```typescript
import { formatBRL, parseBRL } from '@/lib/utils/currency'

describe('formatBRL', () => {
  it('formats positive number', () => {
    expect(formatBRL(1808.57)).toBe('R$ 1.808,57')
  })
  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
  it('formats negative', () => {
    expect(formatBRL(-7200)).toBe('-R$ 7.200,00')
  })
})

describe('parseBRL', () => {
  it('parses formatted string', () => {
    expect(parseBRL('R$ 1.808,57')).toBe(1808.57)
  })
  it('parses plain number string', () => {
    expect(parseBRL('1808.57')).toBe(1808.57)
  })
})
```

- [ ] **Step 3: Run — expect FAIL**

```bash
npm test -- currency
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 4: Implement currency utils**

`lib/utils/currency.ts`:
```typescript
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function parseBRL(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
```

- [ ] **Step 5: Run — expect PASS**

```bash
npm test -- currency
```

- [ ] **Step 6: Write failing allocation tests**

`__tests__/utils/allocation.test.ts`:
```typescript
import { calculateClientDRE } from '@/lib/utils/allocation'

describe('calculateClientDRE', () => {
  const clientId = 'client-1'

  it('calculates result with no overhead', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 24300,
      directExpenses: 12100,
      overhead: 0,
      totalHoldingRevenue: 100000,
    })
    expect(result.indirectExpenses).toBe(0)
    expect(result.netResult).toBe(12200)
    expect(result.participationPct).toBeCloseTo(24.3)
  })

  it('allocates overhead proportionally', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 50000,
      directExpenses: 20000,
      overhead: 10000,
      totalHoldingRevenue: 100000,
    })
    expect(result.indirectExpenses).toBe(5000) // 50% of overhead
    expect(result.netResult).toBe(25000)
    expect(result.margin).toBe(50)
  })

  it('handles zero holding revenue gracefully', () => {
    const result = calculateClientDRE({
      clientId,
      revenue: 0,
      directExpenses: 0,
      overhead: 5000,
      totalHoldingRevenue: 0,
    })
    expect(result.indirectExpenses).toBe(0)
    expect(result.participationPct).toBe(0)
  })
})
```

- [ ] **Step 7: Run — expect FAIL**

```bash
npm test -- allocation
```

- [ ] **Step 8: Implement allocation util**

`lib/utils/allocation.ts`:
```typescript
export interface ClientDREInput {
  clientId: string
  revenue: number
  directExpenses: number
  overhead: number
  totalHoldingRevenue: number
}

export interface ClientDREResult {
  clientId: string
  revenue: number
  directExpenses: number
  indirectExpenses: number
  netResult: number
  participationPct: number
  margin: number
}

export function calculateClientDRE(input: ClientDREInput): ClientDREResult {
  const { clientId, revenue, directExpenses, overhead, totalHoldingRevenue } = input
  const participationPct = totalHoldingRevenue > 0
    ? (revenue / totalHoldingRevenue) * 100
    : 0
  const indirectExpenses = totalHoldingRevenue > 0
    ? overhead * (revenue / totalHoldingRevenue)
    : 0
  const netResult = revenue - directExpenses - indirectExpenses
  const margin = revenue > 0 ? (netResult / revenue) * 100 : 0
  return { clientId, revenue, directExpenses, indirectExpenses, netResult, participationPct, margin }
}
```

- [ ] **Step 9: Run — expect PASS**

```bash
npm test
```

- [ ] **Step 10: Create date utils**

`lib/utils/date.ts`:
```typescript
import { format, parse, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Converts Excel competência '1/26' to '01/2026' display format */
export function formatCompetencia(raw: string): string {
  const [month, year] = raw.split('/')
  return `${month.padStart(2, '0')}/${year.length === 2 ? '20' + year : year}`
}

/** Returns current month as competencia string e.g. '3/26' */
export function currentCompetencia(): string {
  const now = new Date()
  return `${now.getMonth() + 1}/${String(now.getFullYear()).slice(2)}`
}

/** Returns YYYY-MM string for a given competencia '3/26' */
export function competenciaToYYYYMM(comp: string): string {
  const [month, year] = comp.split('/')
  const fullYear = year.length === 2 ? '20' + year : year
  return `${fullYear}-${month.padStart(2, '0')}`
}

export function formatDate(date: string | Date | null): string {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}
```

- [ ] **Step 11: Commit**

```bash
git add lib/utils/ __tests__/ jest.config.ts package.json
git commit -m "feat: utility functions with tests — currency, dates, DRE allocation"
```

---

### Task 7: Cadastros — Plano de Contas and Companies

**Files:**
- Create: `lib/db/chart-of-accounts.ts`
- Create: `lib/db/companies.ts`
- Create: `app/(app)/cadastros/plano-de-contas/page.tsx`
- Create: `app/(app)/cadastros/empresas/page.tsx`

- [ ] **Step 1: Create chart of accounts queries**

`lib/db/chart-of-accounts.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getChartOfAccounts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .select('*')
    .order('code')
  if (error) throw error
  return data
}

export async function upsertAccount(account: {
  id?: string; code: string; account: string;
  sub_account?: string; description: string; category: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chart_of_accounts')
    .upsert(account)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 2: Create chart of accounts page**

`app/(app)/cadastros/plano-de-contas/page.tsx`:
```typescript
import { getChartOfAccounts } from '@/lib/db/chart-of-accounts'
import { Badge } from '@/components/ui/badge'

export default async function PlanoDeContasPage() {
  const accounts = await getChartOfAccounts()

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Plano de Contas</h1>
      </div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Conta</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-mono text-xs">{acc.code}</td>
                <td className="p-3">{acc.account}</td>
                <td className="p-3">{acc.description}</td>
                <td className="p-3">
                  <Badge variant={acc.category === 'RECEITA' ? 'default' : 'secondary'}>
                    {acc.category}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create companies queries and page**

`lib/db/companies.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getCompanies() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('companies').select('*').order('name')
  if (error) throw error
  return data
}
```

`app/(app)/cadastros/empresas/page.tsx`: same pattern as above showing name, CNPJ, endereço.

- [ ] **Step 4: Seed initial data**

In Supabase dashboard → SQL Editor, run:
```sql
-- Insert companies
INSERT INTO companies (name, cnpj) VALUES
  ('BRASANTOS', '23.372.953.0001-86'),
  ('JJB SERV', '27.468.199/0001-33'),
  ('JJB ADM', '41.106.556.0001-44');

-- Insert key chart of accounts entries (abbreviated — full import in Task 19)
INSERT INTO chart_of_accounts (code, account, sub_account, description, category) VALUES
  ('10.01.001', 'RECEITA', 'RECEITA SUBCONTA', 'RECEITA', 'RECEITA'),
  ('10.01.002', 'RECEITA', 'RECEITA SUBCONTA', 'RECEITA EXTRA', 'RECEITA'),
  ('20.02.001', 'DESPESA', 'DESPESAS FIXAS', 'ALUGUEL', 'DESPESAS FIXAS'),
  ('20.02.003', 'DESPESA', 'DESPESAS FIXAS', 'CONDOMINIO', 'DESPESAS FIXAS'),
  ('20.04.006', 'DESPESA', 'ENCARGOS', 'GFD', 'ENCARGOS');
```

- [ ] **Step 5: Verify pages load**

Navigate to `/cadastros/plano-de-contas` and `/cadastros/empresas` — should render tables.

- [ ] **Step 6: Commit**

```bash
git add app/ lib/db/
git commit -m "feat: cadastros — plano de contas and empresas pages"
```

---

### Task 8: Cadastros — Clientes and Fornecedores

**Files:**
- Create: `lib/db/clients.ts`
- Create: `lib/db/suppliers.ts`
- Create: `app/(app)/cadastros/clientes/page.tsx`
- Create: `app/(app)/cadastros/fornecedores/page.tsx`

- [ ] **Step 1: Create client queries**

`lib/db/clients.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getClients(filters?: { segment?: string; status?: string }) {
  const supabase = await createClient()
  let query = supabase.from('clients').select('*, companies(name)').order('name')
  if (filters?.segment) query = query.eq('segment', filters.segment)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getActiveClients() {
  return getClients({ status: 'ATIVO' })
}

export async function getRealClients() {
  // Exclude ADM/OPERACIONAL/BANCO — these are internal cost centers
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, segment, company_id, companies(name)')
    .not('segment', 'in', '("ADM","OPERACIONAL","BANCO")')
    .eq('status', 'ATIVO')
    .order('name')
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Create clients page**

`app/(app)/cadastros/clientes/page.tsx`: table showing item, name, segment, status, company, CNPJ, contract dates. Filter by status (ATIVO/INATIVO).

- [ ] **Step 3: Create supplier queries**

`lib/db/suppliers.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, companies(name)')
    .order('name')
  if (error) throw error
  return data
}
```

- [ ] **Step 4: Create suppliers page** — same table pattern.

- [ ] **Step 5: Commit**

```bash
git add app/ lib/db/
git commit -m "feat: cadastros — clientes and fornecedores pages"
```

---

## Phase 3 — Core Transaction Entry

### Task 9: Expense transaction list

**Files:**
- Create: `lib/db/expense-transactions.ts`
- Modify: `app/(app)/lancamentos/page.tsx`
- Create: `components/lancamentos/transaction-list.tsx`

- [ ] **Step 1: Create expense transaction queries**

`lib/db/expense-transactions.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export interface ExpenseFilters {
  competencia?: string
  company_id?: string
  status?: string
  account_id?: string
}

export async function getExpenseTransactions(filters: ExpenseFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('expense_transactions')
    .select(`
      *,
      companies(name),
      clients(name),
      suppliers(name),
      chart_of_accounts(code, description, category)
    `)
    .order('due_date', { ascending: true })

  if (filters.competencia) query = query.eq('competencia', filters.competencia)
  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.account_id) query = query.eq('account_id', filters.account_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getDueExpenses(days = 7) {
  const supabase = await createClient()
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)

  const { data, error } = await supabase
    .from('expense_transactions')
    .select('*, companies(name)')
    .eq('status', 'A PAGAR')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', future.toISOString().split('T')[0])
    .order('due_date')

  if (error) throw error
  return data
}
```

- [ ] **Step 2: Create transaction list component**

`components/lancamentos/transaction-list.tsx`:
```typescript
import { formatBRL } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Badge } from '@/components/ui/badge'

const statusVariant = {
  'PAGO': 'default',
  'A PAGAR': 'secondary',
  'A VERIFICAR': 'outline',
} as const

export function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return <p className="text-slate-500 text-sm py-8 text-center">Nenhum lançamento encontrado.</p>
  }

  return (
    <div className="rounded-md border">
      {/* Desktop table */}
      <table className="w-full text-sm hidden md:table">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3 text-left">Empresa</th>
            <th className="p-3 text-left">Descrição</th>
            <th className="p-3 text-left">Fornecedor</th>
            <th className="p-3 text-left">Venc.</th>
            <th className="p-3 text-right">Total</th>
            <th className="p-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id} className="border-t hover:bg-slate-50">
              <td className="p-3 text-xs text-slate-500">{t.companies?.name}</td>
              <td className="p-3">{t.description}</td>
              <td className="p-3 text-xs text-slate-500">{t.suppliers?.name}</td>
              <td className="p-3 text-xs">{formatDate(t.due_date)}</td>
              <td className="p-3 text-right font-medium">{formatBRL(t.total ?? 0)}</td>
              <td className="p-3">
                <Badge variant={statusVariant[t.status as keyof typeof statusVariant] ?? 'outline'}>
                  {t.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {transactions.map(t => (
          <div key={t.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{t.description}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {t.companies?.name} · {t.suppliers?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">{formatBRL(t.total ?? 0)}</p>
                <Badge className="mt-1 text-xs"
                  variant={statusVariant[t.status as keyof typeof statusVariant] ?? 'outline'}>
                  {t.status}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build lançamentos page with filters**

`app/(app)/lancamentos/page.tsx`:
```typescript
import { getExpenseTransactions } from '@/lib/db/expense-transactions'
import { getCompanies } from '@/lib/db/companies'
import { TransactionList } from '@/components/lancamentos/transaction-list'
import { currentCompetencia } from '@/lib/utils/date'

export default async function LancamentosPage({
  searchParams
}: {
  searchParams: Promise<{ comp?: string; company?: string; status?: string }>
}) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()
  const [transactions, companies] = await Promise.all([
    getExpenseTransactions({
      competencia: comp,
      company_id: params.company,
      status: params.status,
    }),
    getCompanies(),
  ])

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Lançamentos</h1>
        <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
          + Novo
        </button>
      </div>
      {/* Filters — URL-based */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm text-slate-600">Competência: {comp}</span>
      </div>
      <TransactionList transactions={transactions} />
    </div>
  )
}
```

- [ ] **Step 4: Verify page loads with no data**

Navigate to `/lancamentos` — should render empty state message.

- [ ] **Step 5: Commit**

```bash
git add app/ components/ lib/db/
git commit -m "feat: lançamentos list — expense transactions with filters"
```

---

### Task 10: Expense transaction form

**Files:**
- Create: `components/lancamentos/transaction-drawer.tsx`
- Create: `components/lancamentos/expense-form.tsx`
- Create: `schemas/expense.ts`
- Modify: `app/(app)/lancamentos/page.tsx`

- [ ] **Step 1: Create Zod schema**

`schemas/expense.ts`:
```typescript
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
  principal: z.coerce.number().min(0),
  fine: z.coerce.number().min(0).default(0),
  interest: z.coerce.number().min(0).default(0),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
```

- [ ] **Step 2: Create Server Action for saving expense**

Create a separate `app/(app)/lancamentos/actions.ts` — server actions must live in a file with `'use server'` at the top, not inline in `lib/db/` modules:

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ExpenseFormData } from '@/schemas/expense'

export async function saveExpenseTransaction(data: ExpenseFormData & { id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const payload = { ...data, created_by: user.id }
  const { error } = data.id
    ? await supabase.from('expense_transactions').update(payload).eq('id', data.id)
    : await supabase.from('expense_transactions').insert(payload)

  if (error) throw error
  revalidatePath('/lancamentos')
}
```

- [ ] **Step 3: Create expense form component**

`components/lancamentos/expense-form.tsx` — a `'use client'` form using `react-hook-form` + `zodResolver`. Fields mirror the spec: company, competência, account (grouped select), client, doc_type, doc_number, supplier, description, installment, issue_date, due_date, payment_date, status, principal, fine, interest, total (read-only computed). On submit calls the Server Action.

- [ ] **Step 4: Create drawer shell**

`components/lancamentos/transaction-drawer.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ExpenseForm } from './expense-form'

export function TransactionDrawer({ companies, clients, suppliers, accounts }: any) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'expense' | 'revenue'>('expense')

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md">
        + Novo
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>Novo Lançamento</DrawerTitle>
            <div className="flex border rounded-md overflow-hidden mt-2">
              <button onClick={() => setType('expense')}
                className={`flex-1 py-2 text-sm ${type === 'expense' ? 'bg-blue-600 text-white' : ''}`}>
                Despesa
              </button>
              <button onClick={() => setType('revenue')}
                className={`flex-1 py-2 text-sm ${type === 'revenue' ? 'bg-green-600 text-white' : ''}`}>
                Receita (NF)
              </button>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            {type === 'expense'
              ? <ExpenseForm onSuccess={() => setOpen(false)}
                  companies={companies} clients={clients}
                  suppliers={suppliers} accounts={accounts} />
              : <p className="text-slate-500 text-sm">Formulário de NF — Task 11</p>
            }
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
```

- [ ] **Step 5: Wire drawer into lançamentos page**

Update `app/(app)/lancamentos/page.tsx` to fetch all reference data and pass to `TransactionDrawer`.

- [ ] **Step 6: Test — create a new expense**

1. Open `/lancamentos`
2. Click "+ Novo"
3. Fill in an expense (e.g. BRASANTOS, Aluguel, R$ 1808,57, PAGO)
4. Submit
5. Verify it appears in the list

- [ ] **Step 7: Commit**

```bash
git add components/lancamentos/ schemas/ lib/db/
git commit -m "feat: expense transaction form with server action"
```

---

### Task 11: Revenue (NF) transaction form

**Files:**
- Create: `components/lancamentos/revenue-form.tsx`
- Create: `schemas/revenue.ts`
- Modify: `lib/db/revenue-transactions.ts`

- [ ] **Step 1: Create revenue queries**

`lib/db/revenue-transactions.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRevenueTransactions(filters: { competencia?: string; company_id?: string } = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('revenue_transactions')
    .select('*, companies(name), clients(name), chart_of_accounts(description)')
    .order('issue_date', { ascending: false })
  if (filters.competencia) query = query.eq('competencia', filters.competencia)
  if (filters.company_id) query = query.eq('company_id', filters.company_id)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Revenue server actions go in app/(app)/lancamentos/actions.ts (same file as expense actions)
// Add these functions there (file already has 'use server' at top):
export async function saveRevenueTransaction(data: RevenueFormData & { id?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const payload = { ...data, created_by: user.id }
  const { error } = data.id
    ? await supabase.from('revenue_transactions').update(payload).eq('id', data.id)
    : await supabase.from('revenue_transactions').insert(payload)
  if (error) throw error
  revalidatePath('/lancamentos')
}

export async function getDueRevenues(days = 7) {
  const supabase = await createClient()
  const today = new Date()
  const future = new Date(today)
  future.setDate(future.getDate() + days)
  const { data, error } = await supabase
    .from('revenue_transactions')
    .select('*, companies(name), clients(name)')
    .eq('status', 'A RECEBER')
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', future.toISOString().split('T')[0])
    .order('due_date')
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Create Zod schema for revenue**

`schemas/revenue.ts` — all NF fields as z.coerce.number().min(0).default(0) for numeric fields, z.string() for text. Include status enum `['RECEBIDO', 'A RECEBER', 'A VERIFICAR']`.

- [ ] **Step 3: Build revenue form**

`components/lancamentos/revenue-form.tsx` — grouped sections:
1. Header (empresa, competência, NF nº, cliente, status, datas)
2. Valores dos serviços (total_services, materials, equipment)
3. Vale Transporte (44h/s e 12×36 — qtde/unit/dias/total com cálculo automático)
4. Vale Alimentação (mesma estrutura)
5. Uniforme (qtde/unit/ano/total)
6. Retenções (campos de imposto — GPS, IRPJ, CSLL, COFINS, PIS, ISSQN)
7. Totais (total_retention e net_value calculados automaticamente)

Use `watch()` from react-hook-form to auto-calculate totals on change.

- [ ] **Step 4: Wire into TransactionDrawer**

Replace the `<p>` placeholder in `transaction-drawer.tsx` with `<RevenueForm ... />`.

- [ ] **Step 5: Update lançamentos list to show both types**

Merge expense and revenue results in `page.tsx` (two queries + sort by due_date). Add type column/indicator to `TransactionList`.

- [ ] **Step 6: Test — create NF**

Create a revenue transaction, verify it appears in the list alongside expenses.

- [ ] **Step 7: Commit**

```bash
git add components/lancamentos/ schemas/revenue.ts lib/db/revenue-transactions.ts
git commit -m "feat: revenue (NF) transaction form with all deduction fields"
```

---

### Task 12: Edit and delete transactions

**Files:**
- Modify: `components/lancamentos/transaction-list.tsx`
- Modify: `components/lancamentos/transaction-drawer.tsx`
- Modify: `lib/db/expense-transactions.ts`
- Modify: `lib/db/revenue-transactions.ts`

- [ ] **Step 1: Add edit action to list rows**

Add an edit button (pencil icon) to each row in `TransactionList`. On click, emit `onEdit(transaction)` callback to parent.

- [ ] **Step 2: Add delete action**

Add `deleteExpenseTransaction(id: string)` and `deleteRevenueTransaction(id: string)` server actions. Confirm dialog before delete.

- [ ] **Step 3: Pre-fill form on edit**

Update `TransactionDrawer` to accept an optional `initialData` prop. When present, pre-fill the form and switch to the correct type tab.

- [ ] **Step 4: Test edit and delete**

Edit an existing expense → change status to PAGO → verify update. Delete a transaction → verify it's removed from list.

- [ ] **Step 5: Commit**

```bash
git add components/lancamentos/ lib/db/
git commit -m "feat: edit and delete transactions"
```

---

## Phase 4 — Recurring Templates

### Task 13: Recurring templates CRUD

**Files:**
- Create: `lib/db/recurring-templates.ts`
- Create: `app/(app)/recorrentes/page.tsx`

- [ ] **Step 1: Create recurring template queries**

`lib/db/recurring-templates.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRecurringTemplates() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*, companies(name), suppliers(name), chart_of_accounts(description)')
    .order('name')
  if (error) throw error
  return data
}

// Recurring template server actions go in app/(app)/recorrentes/actions.ts with 'use server' at top:
export async function saveRecurringTemplate(data: any) {
  const supabase = await createClient()
  const { error } = data.id
    ? await supabase.from('recurring_templates').update(data).eq('id', data.id)
    : await supabase.from('recurring_templates').insert(data)
  if (error) throw error
  revalidatePath('/recorrentes')
}

export async function toggleTemplateActive(id: string, active: boolean) {
  const supabase = await createClient()
  await supabase.from('recurring_templates').update({ active }).eq('id', id)
  revalidatePath('/recorrentes')
}
```

- [ ] **Step 2: Build recorrentes page**

`app/(app)/recorrentes/page.tsx` — list of templates with columns: name, company, frequency, due_day, value, active (toggle), last generated. "+ Novo Template" button opens a form drawer with all template fields.

- [ ] **Step 3: Test — create a monthly template**

Create a template: "Aluguel Sala 613", BRASANTOS, monthly, due_day=10, value=1808.57. Verify it saves.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/recorrentes/ lib/db/recurring-templates.ts
git commit -m "feat: recurring expense templates CRUD"
```

---

### Task 14: Cron endpoint — generate recurring expenses

**Files:**
- Create: `app/api/cron/generate-recurring/route.ts`
- Create: `__tests__/api/generate-recurring.test.ts`
- Create: `vercel.json`

- [ ] **Step 1: Write failing test for cron logic**

`__tests__/api/generate-recurring.test.ts`:
```typescript
import { shouldGenerateThisMonth } from '@/lib/utils/recurring'

describe('shouldGenerateThisMonth', () => {
  const now = new Date('2026-03-01')

  it('monthly template always generates', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'monthly', due_month: null, start_month: '2026-01', end_month: null },
      now
    )).toBe(true)
  })

  it('monthly template does not generate before start_month', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'monthly', due_month: null, start_month: '2026-05', end_month: null },
      now
    )).toBe(false)
  })

  it('annual template generates when month matches', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'annual', due_month: 3, start_month: '2026-01', end_month: null },
      now
    )).toBe(true)
  })

  it('annual template does not generate when month does not match', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'annual', due_month: 5, start_month: '2026-01', end_month: null },
      now
    )).toBe(false)
  })

  it('installments template generates when under limit', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'installments', num_installments: 12, generated_count: 5 },
      now
    )).toBe(true)
  })

  it('installments template stops when limit reached', () => {
    expect(shouldGenerateThisMonth(
      { frequency: 'installments', num_installments: 12, generated_count: 12 },
      now
    )).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- generate-recurring
```

- [ ] **Step 3: Implement recurring util**

`lib/utils/recurring.ts`:
```typescript
interface TemplateCheck {
  frequency: string
  due_month?: number | null
  start_month?: string | null
  end_month?: string | null
  num_installments?: number | null
  generated_count?: number | null
}

export function shouldGenerateThisMonth(template: TemplateCheck, now = new Date()): boolean {
  const currentYYYYMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  if (template.start_month && currentYYYYMM < template.start_month) return false
  if (template.end_month && currentYYYYMM > template.end_month) return false

  if (template.frequency === 'monthly') return true
  if (template.frequency === 'annual') return (template.due_month ?? -1) === now.getMonth() + 1
  if (template.frequency === 'installments') {
    return (template.generated_count ?? 0) < (template.num_installments ?? 0)
  }
  return false
}
```

- [ ] **Step 4: Run — expect PASS**

```bash
npm test
```

- [ ] **Step 5: Create cron endpoint**

`app/api/cron/generate-recurring/route.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { shouldGenerateThisMonth } from '@/lib/utils/recurring'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Security: verify cron secret
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // bypass RLS
  )

  const now = new Date()
  const competencia = `${now.getMonth() + 1}/${String(now.getFullYear()).slice(2)}`

  const { data: templates } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('active', true)

  let generated = 0

  for (const template of templates ?? []) {
    if (!shouldGenerateThisMonth(template, now)) continue

    // Idempotency: check if already generated this month/year
    const { data: existing } = await supabase
      .from('expense_transactions')
      .select('id')
      .eq('recurring_template_id', template.id)
      .eq('competencia', competencia)
      .maybeSingle()

    if (existing) continue // already generated

    await supabase.from('expense_transactions').insert({
      competencia,
      account_id: template.account_id,
      company_id: template.company_id,
      client_id: template.client_id,
      supplier_id: template.supplier_id,
      doc_type: template.doc_type,
      description: template.description,
      due_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(template.due_day).padStart(2, '0')}`,
      status: 'A PAGAR',
      principal: template.value,
      fine: 0,
      interest: 0,
      recurring_template_id: template.id,
    })

    if (template.frequency === 'installments') {
      await supabase
        .from('recurring_templates')
        .update({ generated_count: (template.generated_count ?? 0) + 1 })
        .eq('id', template.id)
    }

    generated++
  }

  return NextResponse.json({ ok: true, generated, competencia })
}
```

- [ ] **Step 6: Create vercel.json and fix cron auth**

`vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-recurring",
      "schedule": "0 9 1 * *"
    }
  ]
}
```

The schedule `0 9 1 * *` runs at 09:00 UTC = 06:00 BRT on the 1st of each month.

Update the auth check in the cron endpoint — Vercel sends `Authorization: Bearer <CRON_SECRET>`, not a custom header. Replace the security check:

```typescript
// Replace this:
const secret = request.headers.get('x-cron-secret')
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// With this:
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

Update the manual test curl command accordingly:
```bash
curl -H "Authorization: Bearer YOUR_SECRET" http://localhost:3000/api/cron/generate-recurring
```

- [ ] **Step 7: Test cron endpoint manually**

```bash
curl -H "x-cron-secret: YOUR_SECRET" http://localhost:3000/api/cron/generate-recurring
```

Expected: `{"ok":true,"generated":0,"competencia":"3/26"}` (no active templates yet).

- [ ] **Step 8: Commit**

```bash
git add app/api/ lib/utils/recurring.ts __tests__/ vercel.json
git commit -m "feat: cron endpoint for recurring expense generation with idempotency"
```

---

## Phase 5 — Dashboard

### Task 15: Dashboard — company cards and holding summary

**Files:**
- Create: `lib/db/analytics.ts`
- Create: `components/dashboard/company-card.tsx`
- Create: `components/dashboard/holding-summary.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create analytics queries**

`lib/db/analytics.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'

export async function getMonthlySummaryByCompany(competencia: string) {
  const supabase = await createClient()

  const [{ data: expenses }, { data: revenues }] = await Promise.all([
    supabase
      .from('expense_transactions')
      .select('company_id, total, companies(name)')
      .eq('competencia', competencia),
    supabase
      .from('revenue_transactions')
      .select('company_id, net_value, companies(name)')
      .eq('competencia', competencia),
  ])

  // Group by company
  const companies: Record<string, { name: string; revenue: number; expense: number }> = {}

  for (const r of revenues ?? []) {
    const key = r.company_id
    if (!companies[key]) companies[key] = { name: (r as any).companies?.name ?? '', revenue: 0, expense: 0 }
    companies[key].revenue += r.net_value ?? 0
  }
  for (const e of expenses ?? []) {
    const key = e.company_id
    if (!companies[key]) companies[key] = { name: (e as any).companies?.name ?? '', revenue: 0, expense: 0 }
    companies[key].expense += e.total ?? 0
  }

  return Object.entries(companies).map(([id, data]) => ({
    company_id: id,
    ...data,
    balance: data.revenue - data.expense,
  }))
}
```

- [ ] **Step 2: Create company card component**

`components/dashboard/company-card.tsx`:
```typescript
import { formatBRL } from '@/lib/utils/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CompanyCardProps {
  name: string; revenue: number; expense: number; balance: number
}

export function CompanyCard({ name, revenue, expense, balance }: CompanyCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-green-600">Receita</span>
          <span className="font-medium">{formatBRL(revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-500">Despesa</span>
          <span className="font-medium">{formatBRL(expense)}</span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="font-semibold">Saldo</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {formatBRL(balance)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Build dashboard page**

`app/(app)/dashboard/page.tsx`:
```typescript
import { getMonthlySummaryByCompany } from '@/lib/db/analytics'
import { CompanyCard } from '@/components/dashboard/company-card'
import { currentCompetencia } from '@/lib/utils/date'

export default async function DashboardPage({
  searchParams
}: { searchParams: Promise<{ comp?: string }> }) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()
  const summaries = await getMonthlySummaryByCompany(comp)

  const totals = summaries.reduce(
    (acc, s) => ({ revenue: acc.revenue + s.revenue, expense: acc.expense + s.expense, balance: acc.balance + s.balance }),
    { revenue: 0, expense: 0, balance: 0 }
  )

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard — {comp}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaries.map(s => <CompanyCard key={s.company_id} {...s} />)}
      </div>
      {/* Holding total */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
        <span className="font-bold">HOLDING — Total</span>
        <div className="flex gap-6 text-sm">
          <span className="text-green-600 font-semibold">Receita: {formatBRL(totals.revenue)}</span>
          <span className="text-red-500 font-semibold">Despesa: {formatBRL(totals.expense)}</span>
          <span className={`font-bold ${totals.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
            Saldo: {formatBRL(totals.balance)}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify dashboard renders**

Add some test transactions via the lançamentos form, then visit `/dashboard`.

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/ components/dashboard/ lib/db/analytics.ts
git commit -m "feat: dashboard with company cards and holding summary"
```

---

### Task 16: Dashboard — due date alerts

**Files:**
- Create: `components/dashboard/due-alerts.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create due alerts component**

`components/dashboard/due-alerts.tsx`:
```typescript
import { formatBRL } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface DueItem {
  id: string; description: string; companies: { name: string } | null
  due_date: string; total?: number; net_value?: number
}

export function DueAlerts({ expenses, revenues }: { expenses: DueItem[]; revenues: DueItem[] }) {
  const items = [
    ...expenses.map(e => ({ ...e, type: 'despesa', amount: e.total ?? 0 })),
    ...revenues.map(r => ({ ...r, type: 'receita', amount: r.net_value ?? 0 })),
  ].sort((a, b) => a.due_date.localeCompare(b.due_date))

  if (items.length === 0) return null

  return (
    <Alert className="border-yellow-300 bg-yellow-50 mb-6">
      <AlertTitle>⚠️ {items.length} conta(s) vencem nos próximos 7 dias</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-1">
          {items.map(item => (
            <li key={item.id} className="text-sm flex justify-between">
              <span>{item.description} · <span className="text-slate-500">{item.companies?.name}</span></span>
              <span className="font-medium">{formatBRL(item.amount)} — {formatDate(item.due_date)}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
```

- [ ] **Step 2: Wire into dashboard page**

Import `getDueExpenses` and `getDueRevenues`, pass to `DueAlerts` above the company cards.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/due-alerts.tsx app/(app)/dashboard/
git commit -m "feat: due date alerts on dashboard (7-day window)"
```

---

## Phase 6 — Análise de Clientes

### Task 17: Client DRE list

**Files:**
- Modify: `lib/db/analytics.ts`
- Create: `components/analise/client-dre-list.tsx`
- Modify: `app/(app)/analise/page.tsx`

- [ ] **Step 1: Add DRE query to analytics**

Add to `lib/db/analytics.ts`:
```typescript
export async function getClientDREData(competencia: string) {
  const supabase = await createClient()
  const [{ data: revenues }, { data: expenses }, { data: clients }] = await Promise.all([
    supabase.from('revenue_transactions').select('client_id, net_value, clients(name, segment)')
      .eq('competencia', competencia),
    supabase.from('expense_transactions').select('client_id, total, clients(name, segment)')
      .eq('competencia', competencia),
    supabase.from('clients').select('id, name, segment').not('segment', 'in', '("BANCO")'),
  ])

  const totalHoldingRevenue = revenues?.reduce((s, r) => s + (r.net_value ?? 0), 0) ?? 0

  // Overhead = expenses linked to ADM/OPERACIONAL clients or null client
  const overhead = expenses
    ?.filter(e => !e.client_id || ['ADM', 'OPERACIONAL'].includes((e as any).clients?.segment ?? ''))
    .reduce((s, e) => s + (e.total ?? 0), 0) ?? 0

  // Group revenues and direct expenses by real client
  const clientRevenue: Record<string, number> = {}
  const clientDirectExpense: Record<string, number> = {}

  for (const r of revenues ?? []) {
    const seg = (r as any).clients?.segment ?? ''
    if (['ADM', 'OPERACIONAL', 'BANCO'].includes(seg)) continue
    clientRevenue[r.client_id] = (clientRevenue[r.client_id] ?? 0) + (r.net_value ?? 0)
  }
  for (const e of expenses ?? []) {
    const seg = (e as any).clients?.segment ?? ''
    if (!e.client_id || ['ADM', 'OPERACIONAL', 'BANCO'].includes(seg)) continue
    clientDirectExpense[e.client_id] = (clientDirectExpense[e.client_id] ?? 0) + (e.total ?? 0)
  }

  const results = Object.keys(clientRevenue).map(clientId => {
    const client = clients?.find(c => c.id === clientId)
    return calculateClientDRE({
      clientId,
      revenue: clientRevenue[clientId] ?? 0,
      directExpenses: clientDirectExpense[clientId] ?? 0,
      overhead,
      totalHoldingRevenue,
    })
  })

  return { results, overhead, totalHoldingRevenue }
}
```

- [ ] **Step 2: Build client DRE list component**

`components/analise/client-dre-list.tsx` — table showing: client name, receita, despesa direta, despesa indireta, resultado, participação %, margem %. Positive results in green, negative in red. Clickable rows to show detail.

- [ ] **Step 3: Build analise page with tabs**

`app/(app)/analise/page.tsx`:
```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientDREList } from '@/components/analise/client-dre-list'
import { ClientCrossTable } from '@/components/analise/client-cross-table'
import { getClientDREData } from '@/lib/db/analytics'
import { currentCompetencia } from '@/lib/utils/date'

export default async function AnalisePage({
  searchParams
}: { searchParams: Promise<{ comp?: string }> }) {
  const params = await searchParams
  const comp = params.comp ?? currentCompetencia()
  const { results, overhead } = await getClientDREData(comp)

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold mb-4">Análise de Clientes — {comp}</h1>
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Por cliente</TabsTrigger>
          <TabsTrigger value="table">Tabela cruzada</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ClientDREList results={results} overhead={overhead} />
        </TabsContent>
        <TabsContent value="table">
          <ClientCrossTable comp={comp} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(app)/analise/ components/analise/ lib/db/analytics.ts
git commit -m "feat: client DRE list with proportional overhead allocation"
```

---

### Task 18: Client DRE detail and cross-table

**Files:**
- Create: `components/analise/client-dre-detail.tsx`
- Create: `components/analise/client-cross-table.tsx`
- Modify: `lib/db/analytics.ts`

- [ ] **Step 1: Add cross-table query**

Add to `lib/db/analytics.ts`:
```typescript
export async function getClientCrossTable(year: number) {
  const supabase = await createClient()
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}/${String(year).slice(2)}`)
  const results = await Promise.all(months.map(comp => getClientDREData(comp)))

  // Fetch client names for ID lookup
  const { data: clientsData } = await supabase.from('clients').select('id, name')
  const clientNames: Record<string, string> = {}
  for (const c of clientsData ?? []) clientNames[c.id] = c.name

  // Build: { [clientId]: { name, months: { [comp]: netResult } } }
  const table: Record<string, { name: string; months: Record<string, number> }> = {}
  results.forEach(({ results: monthResults }, idx) => {
    monthResults.forEach(r => {
      if (!table[r.clientId]) {
        table[r.clientId] = { name: clientNames[r.clientId] ?? r.clientId, months: {} }
      }
      table[r.clientId].months[months[idx]] = r.netResult
    })
  })
  return table
}
```

- [ ] **Step 2: Build cross table component**

`components/analise/client-cross-table.tsx` — server component that fetches the year's data and renders a scrollable table: clients as rows, months as columns, total annual column.

- [ ] **Step 3: Build client detail panel**

`components/analise/client-dre-detail.tsx` — shown inline (expandable row or modal) when a client is clicked. Shows:
- Summary header (revenue, participation %, result)
- Direct expenses table (description, account, value)
- Indirect expenses table (description, allocated amount)

Requires a detailed query: `getClientDREDetail(competencia, clientId)` — fetches individual transactions for that client.

- [ ] **Step 4: Commit**

```bash
git add components/analise/ lib/db/analytics.ts
git commit -m "feat: client DRE detail panel and annual cross-table"
```

---

## Phase 7 — Relatórios

### Task 19: Monthly report and export

**Files:**
- Create: `components/relatorios/monthly-report.tsx`
- Create: `components/relatorios/revenue-expense-chart.tsx`
- Modify: `app/(app)/relatorios/page.tsx`
- Modify: `lib/db/analytics.ts`

- [ ] **Step 1: Add report query**

Add to `lib/db/analytics.ts`:
```typescript
export async function getMonthlyReport(competencia: string, company_id?: string) {
  const supabase = await createClient()
  let expQ = supabase.from('expense_transactions')
    .select('total, chart_of_accounts(account, category)')
    .eq('competencia', competencia)
  let revQ = supabase.from('revenue_transactions')
    .select('net_value').eq('competencia', competencia)

  if (company_id) { expQ = expQ.eq('company_id', company_id); revQ = revQ.eq('company_id', company_id) }

  const [{ data: expenses }, { data: revenues }] = await Promise.all([expQ, revQ])

  const totalRevenue = revenues?.reduce((s, r) => s + (r.net_value ?? 0), 0) ?? 0
  const totalExpense = expenses?.reduce((s, e) => s + (e.total ?? 0), 0) ?? 0

  // Group expenses by account (level-2)
  const byAccount: Record<string, number> = {}
  for (const e of expenses ?? []) {
    const acct = (e as any).chart_of_accounts?.account ?? 'SEM CONTA'
    byAccount[acct] = (byAccount[acct] ?? 0) + (e.total ?? 0)
  }

  return { totalRevenue, totalExpense, balance: totalRevenue - totalExpense, byAccount }
}
```

- [ ] **Step 2: Build monthly report component**

`components/relatorios/monthly-report.tsx` — shows revenue, expense, balance cards + breakdown table by account category.

- [ ] **Step 3: Add bar chart**

`components/relatorios/revenue-expense-chart.tsx`:
```typescript
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function RevenueExpenseChart({ data }: { data: { month: string; revenue: number; expense: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
        <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
        <Legend />
        <Bar dataKey="revenue" name="Receita" fill="#22c55e" />
        <Bar dataKey="expense" name="Despesa" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 4: Build relatórios page**

`app/(app)/relatorios/page.tsx` — shows monthly report for selected month + company, plus chart with last 6 months of data.

- [ ] **Step 5: Add CSV export**

Add a "Exportar CSV" button that builds and downloads a CSV from the transactions:
```typescript
function exportCSV(transactions: any[]) {
  const headers = ['Competência', 'Empresa', 'Descrição', 'Fornecedor', 'Vencimento', 'Total', 'Status']
  const rows = transactions.map(t => [
    t.competencia, t.companies?.name, t.description,
    t.suppliers?.name, t.due_date, t.total, t.status
  ])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM for Excel
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `lancamentos.csv`; a.click()
}
```

- [ ] **Step 6: Commit**

```bash
git add app/(app)/relatorios/ components/relatorios/ lib/db/analytics.ts
git commit -m "feat: monthly reports with chart and CSV export"
```

---

## Phase 8 — Data Migration

### Task 20: Excel import script

**Files:**
- Create: `scripts/import-excel.ts`

- [ ] **Step 1: Install xlsx**

```bash
npm install xlsx
npm install -D @types/xlsx
```

- [ ] **Step 2: Create import script skeleton**

`scripts/import-excel.ts`:
```typescript
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'

const EXCEL_FILE = path.join(__dirname, '../Base_2026_ RECEITA X DESPESAS.xlsx')
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role to bypass RLS
)

async function main() {
  const wb = XLSX.readFile(EXCEL_FILE, { cellDates: true })

  console.log('1. Importing companies...')
  await importCompanies(wb)
  console.log('2. Importing chart of accounts...')
  await importChartOfAccounts(wb)
  console.log('3. Importing clients...')
  await importClients(wb)
  console.log('4. Importing suppliers...')
  await importSuppliers(wb)
  console.log('5. Importing revenues...')
  await importRevenues(wb)
  console.log('6. Importing monthly expenses...')
  await importMonthlyExpenses(wb)
  console.log('7. Importing recurring matrix...')
  await importRecurringMatrix(wb)
  console.log('✅ Import complete')
}
```

- [ ] **Step 3: Implement `importCompanies`**

Read `TA Empresa` sheet. Map columns: EMPRESA → name, CNPJ → cnpj, INSCRIÇÃO → inscricao_municipal, ENDEREÇO → address, CEP → cep. Upsert by name.

- [ ] **Step 4: Implement `importChartOfAccounts`**

Read `TA Gerencial` sheet. Skip header rows until row with 'Código' header. Map Código → code, CONTA → account, SUBCONTA → sub_account, DESCRIÇÃO → description, Categoria → category. Upsert by code.

- [ ] **Step 5: Implement `importClients`**

Read `TA Cliente` sheet. Skip header. Map all columns per schema. `year` = YEAR(contract_start) or fallback to ANO column. Upsert by name + company_id.

- [ ] **Step 6: Implement `importSuppliers`**

Read `TA Fornecedor` sheet. Map FORNECEDOR → name, RAZÃO SOCIAL → razao_social, etc. Skip rows without name.

- [ ] **Step 7: Implement `importRevenues`**

For each sheet matching pattern `2026_RECEITA_*`:
- Determine company_id from sheet name suffix
- Skip header rows until row with 'COMP' header
- Map each data row to `revenue_transactions` fields
- Parse `competencia` from COMP column (e.g. '01/24' → '1/24')
- Calculate net_value if not present

- [ ] **Step 8: Implement `importMonthlyExpenses`**

For each month sheet (JAN, FEV, MAR, ABR, MAI, JUN, JUL, AGO, SET, OUT, NOV, DEZ):
- Skip header rows until row with 'COMPETÊNCIA' header
- Skip group header rows (where all fields are identical — e.g. the 'DESPESAS FIXAS' separator rows)
- Map each valid data row to `expense_transactions`
- Look up account_id from chart_of_accounts by code
- Look up company_id from companies by name
- Look up client_id from clients by name
- Look up supplier_id from suppliers by name
- Convert status: 'PAGO' → 'PAGO', 'A PAGAR' → 'A PAGAR', others → 'A VERIFICAR'
- Skip rows with `#N/A` in code (empty template rows)

- [ ] **Step 9: Implement `importRecurringMatrix`**

Read `2026_MATRIZ_DESPESAS` sheet. Rows with STATUS = 'MATRIZ' create `recurring_templates`. Others create `expense_transactions` with `recurring_template_id = null`.

- [ ] **Step 10: Run script**

```bash
NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=yyy \
  npx ts-node --project tsconfig.json scripts/import-excel.ts
```

Expected output: counts of imported records per entity, no errors.

- [ ] **Step 11: Verify data in app**

- Navigate to `/cadastros/clientes` — should see all clients
- Navigate to `/lancamentos` — should see December expenses
- Navigate to `/dashboard` — should see monthly summaries

- [ ] **Step 12: Commit**

```bash
git add scripts/
git commit -m "feat: Excel migration script — imports all entities and transactions"
```

---

## Phase 9 — Deploy

### Task 21: Deploy to Vercel and Supabase

**Files:**
- None (configuration only)

- [ ] **Step 1: Push code to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/brasantos-finance.git
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

1. Go to https://vercel.com/new
2. Import the GitHub repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
4. Deploy

- [ ] **Step 3: Verify production**

- Open the Vercel URL
- Log in
- Verify lançamentos, dashboard, analise pages load with real data

- [ ] **Step 4: Test cron endpoint in production**

```bash
curl -H "x-cron-secret: YOUR_SECRET" https://YOUR_APP.vercel.app/api/cron/generate-recurring
```

Expected: `{"ok":true,"generated":0}` (assuming no active templates yet for current month).

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: add .env.example and deployment notes"
```

---

## Summary

| Phase | Tasks | Key Deliverable |
|---|---|---|
| Foundation | 1–5 | Project setup, DB schema, Auth, Layout |
| Reference Data | 6–8 | Utility functions (tested), Cadastros pages |
| Core Entry | 9–12 | Lançamentos list + Expense + Revenue forms |
| Recurring | 13–14 | Template CRUD + Cron endpoint (tested) |
| Dashboard | 15–16 | Company cards + Due alerts |
| Analysis | 17–18 | Client DRE list + cross table |
| Reports | 19 | Monthly reports + chart + CSV |
| Migration | 20 | Excel import script |
| Deploy | 21 | Live on Vercel |
