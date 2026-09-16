import type { PurchaseStatus } from '@/types/purchase.types'

interface PurchaseStatusBadgeProps {
  status: PurchaseStatus
}

export function PurchaseStatusBadge({ status }: PurchaseStatusBadgeProps) {
  const statusConfig = {
    DRAFT: { label: 'Brouillon', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
    ORDERED: { label: 'Commandée', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    RECEIVED: { label: 'Reçue', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
    CANCELLED: { label: 'Annulée', bgColor: 'bg-rose-100', textColor: 'text-rose-700' },
  }

  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  )
}
