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
        Brasantos Finance
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
