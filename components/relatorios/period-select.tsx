'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { lastNMonths, formatCompetencia } from '@/lib/utils/date'

export function PeriodSelect({ value }: { value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('comp', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={value}
      className="border rounded-md px-2 py-1 text-sm"
      onChange={handleChange}
    >
      {lastNMonths(12).map(m => (
        <option key={m} value={m}>{formatCompetencia(m)}</option>
      ))}
    </select>
  )
}
