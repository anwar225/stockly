'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { PaymentTable } from './payment-table'
import { PaymentDetailDialog } from './payment-detail-dialog'
import type { Payment, PaymentListItem } from '@/types/payment.types'

const methodLabels: Record<string, string> = {
  CASH: 'Espèces',
  CARD: 'Carte',
  BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque',
}

export function PaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('Toutes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments')
      if (!response.ok) throw new Error('Failed to fetch payments')
      const data = await response.json()
      setPayments(data)
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError('Erreur lors du chargement des paiements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const filteredPayments = payments.filter((payment) => {
    const normalizedSearch = search.toLowerCase().trim()
    const matchesSearch =
      payment.reference?.toLowerCase().includes(normalizedSearch) ||
      (payment.invoice?.reference?.toLowerCase().includes(normalizedSearch) ?? false) ||
      (payment.invoice?.sale?.customer?.name?.toLowerCase().includes(normalizedSearch) ?? false)

    const matchesMethod = methodFilter === 'Toutes' || payment.method === methodFilter

    return matchesSearch && matchesMethod
  })

  const totalPayments = payments.length
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  const handleOpenDetail = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}`)
      if (!response.ok) throw new Error('Failed to fetch payment')
      const data = await response.json()
      setSelectedPayment(data)
      setDetailDialogOpen(true)
    } catch (err) {
      console.error('Error fetching payment:', err)
      alert('Erreur lors du chargement du paiement.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-rose-600">{error}</div>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Paiements"
        subtitle="Historique des paiements et encaissements."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total paiements</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{totalPayments}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total encaissé</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(totalAmount)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Paiements du jour</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {payments.filter((p) => new Date(p.paymentDate).toDateString() === new Date().toDateString()).length}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par paiement, facture ou client..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
        </div>
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
        >
          <option value="Toutes">Toutes</option>
          <option value="CASH">Espèces</option>
          <option value="CARD">Carte</option>
          <option value="BANK_TRANSFER">Virement</option>
          <option value="CHECK">Chèque</option>
        </select>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
          <div className="text-slate-500">Aucun paiement</div>
        </div>
      ) : (
        <PaymentTable
          payments={filteredPayments}
          onOpenDetail={handleOpenDetail}
          methodLabels={methodLabels}
        />
      )}

      <PaymentDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        payment={selectedPayment}
        methodLabels={methodLabels}
      />
    </div>
  )
}
