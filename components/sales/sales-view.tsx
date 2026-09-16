'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ShoppingCart } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { SaleTable } from './sale-table'
import { SaleDialog } from './sale-dialog'
import { SaleDetailDialog } from './sale-detail-dialog'
import type { Sale, SaleListItem, SaleCreateInput } from '@/types/sale.types'
import type { Customer } from '@/types/customer.types'
import type { ApiProduct } from '@/types/product.types'

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
}

export function SalesView() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Tous')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSales = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/sales')
      if (!response.ok) throw new Error('Failed to fetch sales')
      const data = await response.json()
      setSales(data)
    } catch (err) {
      setError('Erreur lors du chargement des ventes')
      console.error(err)
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

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  useEffect(() => {
    fetchSales()
    fetchCustomers()
    fetchProducts()
  }, [])

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.reference.toLowerCase().includes(search.toLowerCase()) ||
      sale.customer.name.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'Tous' || sale.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const salesListItems: SaleListItem[] = filteredSales.map((sale) => ({
    id: sale.id,
    reference: sale.reference,
    customerName: sale.customer.name,
    saleDate: sale.saleDate,
    status: sale.status,
    totalAmount: sale.totalAmount,
    itemsCount: sale.items.length,
  }))

  // Calculate KPIs
  const totalSales = sales.length
  const draftSales = sales.filter((s) => s.status === 'DRAFT').length
  const confirmedSales = sales.filter((s) => s.status === 'CONFIRMED').length
  const cancelledSales = sales.filter((s) => s.status === 'CANCELLED').length
  const revenue = sales
    .filter((s) => s.status === 'CONFIRMED')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const handleAdd = () => {
    setDialogOpen(true)
  }

  const handleView = (saleListItem: SaleListItem) => {
    const sale = sales.find((s) => s.id === saleListItem.id)
    if (sale) {
      setSelectedSale(sale)
      setDetailDialogOpen(true)
    }
  }

  const handleSubmit = async (data: SaleCreateInput) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create sale')
      }

      setDialogOpen(false)
      await fetchSales()
      alert('Vente créée avec succès.')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la création de la vente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirm = async (saleId: string) => {
    if (!confirm('Confirmer cette vente ?')) return

    try {
      const response = await fetch(`/api/sales/${saleId}/confirm`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          // Extract product name from error message if available
          const errorMessage = errorData.error || 'Impossible de confirmer la vente.'
          let userMessage = 'Impossible de confirmer la vente : stock insuffisant.'
          
          if (errorMessage.includes('Insufficient stock for product:')) {
            const match = errorMessage.match(/Insufficient stock for product: (.+)/)
            if (match && match[1]) {
              userMessage = `Impossible de confirmer la vente : stock insuffisant pour le produit « ${match[1]} ».`
            }
          }
          
          alert(userMessage)
          return
        }
        throw new Error(errorData.error || 'Failed to confirm sale')
      }

      await fetchSales()
      if (selectedSale?.id === saleId) {
        await fetchSaleDetail(saleId)
      }
      alert('Vente confirmée avec succès.')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de la confirmation.')
    }
  }

  const handleCancel = async (saleId: string) => {
    if (!confirm('Annuler cette vente ?')) return

    try {
      const response = await fetch(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel sale')
      }

      await fetchSales()
      if (selectedSale?.id === saleId) {
        await fetchSaleDetail(saleId)
      }
      alert('Vente annulée.')
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'annulation.')
    }
  }

  const fetchSaleDetail = async (saleId: string) => {
    try {
      const response = await fetch(`/api/sales/${saleId}`)
      if (!response.ok) throw new Error('Failed to fetch sale detail')
      const data = await response.json()
      setSelectedSale(data)
    } catch (err) {
      console.error('Error fetching sale detail:', err)
    }
  }

  return (
    <>
      <PageHeading
        title="Ventes"
        subtitle="Gérez vos ventes et leur statut."
        action={
          <button
            onClick={handleAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            <Plus size={17} />
            Nouvelle vente
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total ventes</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{totalSales}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Brouillons</p>
          <p className="mt-1 text-2xl font-semibold text-slate-600">{draftSales}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Confirmées</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{confirmedSales}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Annulées</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">{cancelledSales}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">CA Confirmées</p>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{revenue.toLocaleString()} MAD</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par référence ou client..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            >
              <option value="Tous">Tous</option>
              <option value="DRAFT">Brouillon</option>
              <option value="CONFIRMED">Confirmée</option>
              <option value="CANCELLED">Annulée</option>
            </select>
            <div className="text-sm text-slate-500">
              {salesListItems.length} vente{salesListItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement des ventes...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button
              onClick={fetchSales}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <SaleTable sales={salesListItems} onView={handleView} />
        )}
      </div>

      <SaleDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        customers={customers}
        products={products}
        isSubmitting={isSubmitting}
      />

      {selectedSale && (
        <SaleDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false)
            setSelectedSale(null)
          }}
          sale={selectedSale}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  )
}
