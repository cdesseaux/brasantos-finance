'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/cadastros/empresas', label: 'Empresas' },
  { href: '/cadastros/clientes', label: 'Clientes' },
  { href: '/cadastros/fornecedores', label: 'Fornecedores' },
  { href: '/cadastros/plano-de-contas', label: 'Plano de Contas' },
]

export default function CadastrosLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="border-b bg-white px-4 md:px-6">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                pathname.startsWith(tab.href)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
