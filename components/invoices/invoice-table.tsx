'use client'

import { Eye } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { InvoiceListItem } from '@/types/invoice.types'

interface InvoiceTableProps {
  invoices: InvoiceListItem[]
  onOpenDetail: (invoiceId: string) => void
  statusLabels: Record<string, string>
}

export function InvoiceTable({ invoices, onOpenDetail, statusLabels }: InvoiceTableProps) {
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
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Référence</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Client</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Vente</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Échéance</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Montant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Statut</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3 text-sm text-slate-900">{invoice.reference}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{invoice.sale.customer.name}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{invoice.sale.reference}</td>
              <td className="px-4 py-3 text-sm text-slate-900">{formatDate(invoice.invoiceDate)}</td>
              <td className="px-4 py-3 text-sm text-slate-900">
                {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-slate-900">{formatCurrency(invoice.totalAmount)}</td>
              <td className="px-4 py-3 text-sm">
                <StatusBadge status={statusLabels[invoice.status]} />
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onOpenDetail(invoice.id)}
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
