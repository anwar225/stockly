import type { StockStatus, MovementType } from '@/types'

const statusStyles: Record<string, string> = {
  'En stock': 'bg-emerald-50 text-emerald-700',
  'Stock faible': 'bg-amber-50 text-amber-700',
  Rupture: 'bg-rose-50 text-rose-700',
}

const movementStyles: Record<string, string> = {
  Entrée: 'bg-emerald-50 text-emerald-700',
  Sortie: 'bg-rose-50 text-rose-700',
  Ajustement: 'bg-blue-50 text-blue-700',
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        statusStyles[status] ?? movementStyles[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  )
}
