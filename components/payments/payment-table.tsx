'use client'

import { Eye } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { PaymentListItem } from '@/types/payment.types'

interface PaymentTableProps {
  payments: PaymentListItem[]
  onOpenDetail: (paymentId: string) => void
  methodLabels: Record<string, string>
}

export function PaymentTable({ payments, onOpenDetail, methodLabels }: PaymentTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Référence</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Facture</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Client</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Méthode</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Montant</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm text-slate-900">{formatDate(payment.paymentDate)}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{payment.reference || '-'}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{payment.invoice?.reference || '-'}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{payment.invoice?.sale?.customer?.name || '-'}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{methodLabels[payment.method]}</td>
              <td className="px-4 py-3 text-sm text-right text-slate-900">{formatCurrency(payment.amount)}</td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onOpenDetail(payment.id)}
                  className="text-slate-500 hover:text-emerald-600 transition-colors"
                  title="Voir le détail"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
