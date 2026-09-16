'use client'

import { X } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Payment } from '@/types/payment.types'

interface PaymentDetailDialogProps {
  open: boolean
  onClose: () => void
  payment: Payment | null
  methodLabels: Record<string, string>
}

export function PaymentDetailDialog({ open, onClose, payment, methodLabels }: PaymentDetailDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  if (!open || !payment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Détail paiement</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Payment Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Montant</div>
              <div className="text-2xl font-semibold text-slate-900">{formatCurrency(payment.amount)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Méthode</div>
              <div className="text-sm text-slate-900">{methodLabels[payment.method]}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Date du paiement</div>
              <div className="text-sm text-slate-900">{formatDateTime(payment.paymentDate)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Référence</div>
              <div className="text-sm text-slate-900">{payment.reference || '-'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Référence externe</div>
              <div className="text-sm text-slate-900">{payment.externalReference || '-'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Date de création</div>
              <div className="text-sm text-slate-900">{formatDateTime(payment.createdAt)}</div>
            </div>
          </div>

          {payment.notes && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Notes</div>
              <div className="text-sm text-slate-900">{payment.notes}</div>
            </div>
          )}

          {/* Facture Info */}
          {payment.invoice && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Facture</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <div className="text-slate-500">Référence</div>
                  <div className="text-slate-900">{payment.invoice.reference}</div>
                </div>
                <div>
                  <div className="text-slate-500">Montant total</div>
                  <div className="text-slate-900">{formatCurrency(payment.invoice.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Statut</div>
                  <div className="text-slate-900">{payment.invoice.status}</div>
                </div>
                <div>
                  <div className="text-slate-500">Date de facture</div>
                  <div className="text-slate-900">{formatDate(payment.invoice.invoiceDate)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Client Info */}
          {payment.invoice?.sale?.customer && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Client</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <div className="text-slate-500">Nom</div>
                  <div className="text-slate-900">{payment.invoice.sale.customer.name}</div>
                </div>
              </div>
            </div>
          )}

          {/* Vente Info */}
          {payment.invoice?.sale && (
            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Vente</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <div className="text-slate-500">Référence</div>
                  <div className="text-slate-900">{payment.invoice.sale.reference}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
