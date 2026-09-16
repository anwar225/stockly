'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { PaymentDialog } from '@/components/payments/payment-dialog'
import type { Invoice } from '@/types/invoice.types'
import type { PaymentCreateInput } from '@/types/payment.types'

interface InvoiceDetailDialogProps {
  open: boolean
  onClose: () => void
  invoice: Invoice | null
  statusLabels: Record<string, string>
  onInvoiceUpdate?: (updatedInvoice: Invoice) => void
}

export function InvoiceDetailDialog({ open, onClose, invoice, statusLabels, onInvoiceUpdate }: InvoiceDetailDialogProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoice)

  useEffect(() => {
    if (open && invoice) {
      setSelectedInvoice(invoice)
      fetchPayments()
    }
  }, [open, invoice])

  const fetchPayments = async () => {
    if (!invoice) return

    setLoadingPayments(true)
    try {
      const response = await fetch('/api/payments')
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      const invoicePayments = data.filter((p: any) => p.invoiceId === invoice.id)
      setPayments(invoicePayments)
    } catch (err) {
      console.error('Error fetching payments:', err)
    } finally {
      setLoadingPayments(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR')
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = invoice ? invoice.totalAmount - totalPaid : 0

  const handleCreatePayment = async (data: PaymentCreateInput) => {
    setIsSubmittingPayment(true)
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      setPaymentDialogOpen(false)
      await fetchPayments()
      // Refresh invoice to get updated status
      if (invoice) {
        const invoiceResponse = await fetch(`/api/invoices/${invoice.id}`)
        if (invoiceResponse.ok) {
          const updatedInvoice = await invoiceResponse.json()
          setSelectedInvoice(updatedInvoice)
          onInvoiceUpdate?.(updatedInvoice)
        }
      }
      alert('Paiement ajouté avec succès.')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la création du paiement.')
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  if (!open || !invoice) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Détail facture</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          {/* Facture Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Référence</div>
              <div className="text-sm font-semibold text-slate-900">{invoice.reference}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Statut</div>
              <div className="text-sm">
                <StatusBadge status={statusLabels[invoice.status]} />
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Date de facture</div>
              <div className="text-sm text-slate-900">{formatDate(invoice.invoiceDate)}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Échéance</div>
              <div className="text-sm text-slate-900">
                {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1">Notes</div>
              <div className="text-sm text-slate-900">{invoice.notes}</div>
            </div>
          )}

          {/* Client Info */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Client</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div>
                <div className="text-slate-500">Nom</div>
                <div className="text-slate-900">{invoice.sale.customer.name}</div>
              </div>
              <div>
                <div className="text-slate-500">Téléphone</div>
                <div className="text-slate-900">{invoice.sale.customer.phone || '-'}</div>
              </div>
              <div>
                <div className="text-slate-500">Email</div>
                <div className="text-slate-900">{invoice.sale.customer.email || '-'}</div>
              </div>
              <div>
                <div className="text-slate-500">Adresse</div>
                <div className="text-slate-900">{invoice.sale.customer.address || '-'}</div>
              </div>
            </div>
          </div>

          {/* Vente Info */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Vente</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div>
                <div className="text-slate-500">Référence</div>
                <div className="text-slate-900">{invoice.sale.reference}</div>
              </div>
              <div>
                <div className="text-slate-500">Date</div>
                <div className="text-slate-900">{formatDate(invoice.sale.saleDate)}</div>
              </div>
              <div>
                <div className="text-slate-500">Statut</div>
                <div className="text-slate-900">{invoice.sale.status}</div>
              </div>
              <div>
                <div className="text-slate-500">Total</div>
                <div className="text-slate-900">{formatCurrency(invoice.sale.totalAmount)}</div>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Produits</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Produit</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">SKU</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Quantité</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Prix unitaire</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.sale.items?.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="px-4 py-2 text-sm text-slate-900">{item.product.name}</td>
                      <td className="px-4 py-2 text-sm text-slate-900">{item.product.sku}</td>
                      <td className="px-4 py-2 text-right text-sm text-slate-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-sm text-slate-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-2 text-right text-sm text-slate-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paiements */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Paiements</h3>
            {loadingPayments ? (
              <div className="text-slate-500 text-sm">Chargement...</div>
            ) : payments.length === 0 ? (
              <div className="text-slate-500 text-sm">Aucun paiement</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Méthode</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Référence</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-slate-100">
                        <td className="px-4 py-2 text-sm text-slate-900">{formatDateTime(payment.paymentDate)}</td>
                        <td className="px-4 py-2 text-sm text-slate-900">{payment.method}</td>
                        <td className="px-4 py-2 text-sm text-slate-900">{payment.reference || '-'}</td>
                        <td className="px-4 py-2 text-right text-sm text-slate-900">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-500">Total facture</div>
                <div className="text-lg font-semibold text-slate-900">{formatCurrency(invoice.totalAmount)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-500">Total payé</div>
                <div className="text-lg font-semibold text-slate-900">{formatCurrency(totalPaid)}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-slate-500">Reste à payer</div>
                <div className="text-lg font-semibold text-slate-900">{formatCurrency(remaining)}</div>
              </div>
            </div>

            {invoice.status !== 'PAID' && (
              <button
                onClick={() => setPaymentDialogOpen(true)}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Ajouter un paiement
              </button>
            )}
            {invoice.status === 'PAID' && (
              <div className="mt-4 text-sm text-slate-500">Cette facture est entièrement payée.</div>
            )}
          </div>
        </div>

        <PaymentDialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSubmit={handleCreatePayment}
          invoiceId={invoice.id}
          remainingAmount={remaining}
          isSubmitting={isSubmittingPayment}
        />
      </div>
    </div>
  )
}
