'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { InvoiceTable } from './invoice-table'
import { InvoiceDialog } from './invoice-dialog'
import { InvoiceDetailDialog } from './invoice-detail-dialog'
import type { Invoice, InvoiceListItem, InvoiceCreateInput } from '@/types/invoice.types'
import type { Customer } from '@/types/customer.types'
import type { Sale } from '@/types/sale.types'

const statusLabels: Record<string, string> = {
  UNPAID: 'Non payée',
  PARTIALLY_PAID: 'Partiellement payée',
  PAID: 'Payée',
}

export function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Tous')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchInvoices = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (!response.ok) throw new Error('Failed to fetch invoices')
      const data = await response.json()
      setInvoices(data)
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data)
    } catch (err) {
      console.error('Error fetching customers:', err)
    }
  }

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      const data = await response.json()
      setSales(data)
    } catch (err) {
      console.error('Error fetching sales:', err)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchCustomers()
    fetchSales()
  }, [])

  const filteredInvoices = invoices.filter((invoice) => {
    const normalizedSearch = search.toLowerCase().trim()
    const matchesSearch =
      invoice.reference.toLowerCase().includes(normalizedSearch) ||
      invoice.sale.reference.toLowerCase().includes(normalizedSearch) ||
      invoice.sale.customer.name.toLowerCase().includes(normalizedSearch)

    const matchesStatus = statusFilter === 'Tous' || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalInvoices = invoices.length
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

  const handleCreateInvoice = async (data: InvoiceCreateInput) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }

      setDialogOpen(false)
      await fetchInvoices()
      alert('Facture créée avec succès.')
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Erreur lors de la création de la facture.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDetail = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Failed to fetch invoice')
      const data = await response.json()
      setSelectedInvoice(data)
      setDetailDialogOpen(true)
    } catch (err) {
      console.error('Error fetching invoice:', err)
      alert('Erreur lors du chargement de la facture.')
    }
  }

  const handleInvoiceUpdate = async (updatedInvoice: Invoice) => {
    setSelectedInvoice(updatedInvoice)
    await fetchInvoices()
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
          onClick={fetchInvoices}
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
        title="Factures"
        subtitle="Gérez vos factures et leur statut de paiement."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total factures</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{totalInvoices}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Montant total</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(totalAmount)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Factures payées</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {invoices.filter((inv) => inv.status === 'PAID').length}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par facture, vente ou client..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400"
        >
          <option value="Tous">Tous</option>
          <option value="UNPAID">Non payées</option>
          <option value="PARTIALLY_PAID">Partiellement payées</option>
          <option value="PAID">Payées</option>
        </select>
        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nouvelle facture
        </button>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 rounded-lg">
          <div className="text-slate-500">Aucune facture</div>
        </div>
      ) : (
        <InvoiceTable
          invoices={filteredInvoices}
          onOpenDetail={handleOpenDetail}
          statusLabels={statusLabels}
        />
      )}

      <InvoiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateInvoice}
        customers={customers}
        sales={sales.filter((sale) => sale.status === 'CONFIRMED')}
        isSubmitting={isSubmitting}
      />

      <InvoiceDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        invoice={selectedInvoice}
        statusLabels={statusLabels}
        onInvoiceUpdate={handleInvoiceUpdate}
      />
    </div>
  )
}
