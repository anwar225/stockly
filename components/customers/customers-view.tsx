'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { CustomerTable } from './customer-table'
import { CustomerDialog } from './customer-dialog'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import type { Customer, CustomerFormData } from '@/types/customer.types'

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data)
    } catch (err) {
      setError('Erreur lors du chargement des clients')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (customer.phone && customer.phone.includes(search)) ||
      (customer.email && customer.email.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = () => {
    setEditingCustomer(null)
    setDialogOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setDialogOpen(true)
  }

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer)
    setDeleteDialogOpen(true)
    setDeleteError(null)
  }

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setIsSubmitting(true)
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers'
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to save customer')

      setDialogOpen(false)
      setEditingCustomer(null)
      await fetchCustomers()
    } catch (err) {
      console.error(err)
      alert('Erreur lors de l\'enregistrement du client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return

    try {
      setIsDeleting(true)
      setDeleteError(null)
      
      const response = await fetch(`/api/customers/${deletingCustomer.id}`, {
        method: 'DELETE',
      })

      if (response.status === 409) {
        setDeleteError('Impossible de supprimer ce client car il possède des ventes.')
        return
      }

      if (!response.ok) throw new Error('Failed to delete customer')

      setDeleteDialogOpen(false)
      setDeletingCustomer(null)
      await fetchCustomers()
    } catch (err) {
      console.error(err)
      setDeleteError('Erreur lors de la suppression du client')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <PageHeading
        title="Clients"
        subtitle="Gérez vos clients et leurs informations de contact."
        action={
          <button
            onClick={handleAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            <Plus size={17} />
            Ajouter un client
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredCustomers.length} client{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement des clients...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
            <button
              onClick={fetchCustomers}
              className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <CustomerTable customers={filteredCustomers} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>
      <CustomerDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingCustomer(null)
        }}
        onSubmit={handleSubmit}
        customer={editingCustomer}
        isSubmitting={isSubmitting}
      />
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDeletingCustomer(null)
          setDeleteError(null)
        }}
        onConfirm={handleConfirmDelete}
        customerName={deletingCustomer?.name || ''}
        isDeleting={isDeleting}
      />
      {deleteError && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-rose-500 px-4 py-3 text-sm text-white shadow-lg">
          {deleteError}
        </div>
      )}
    </>
  )
}
