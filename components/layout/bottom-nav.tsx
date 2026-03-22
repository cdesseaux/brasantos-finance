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
