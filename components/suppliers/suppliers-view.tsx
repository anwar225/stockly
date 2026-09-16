import { Plus, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { SupplierTable } from './supplier-table'
import type { Supplier } from '@/types/supplier.types'

interface SuppliersViewProps {
  suppliers: Supplier[]
  search: string
  setSearch: (value: string) => void
  onAdd: () => void
  onEdit: (supplier: Supplier) => void
  onDelete: (supplier: Supplier) => void
  loading?: boolean
  error?: string | null
}

export function SuppliersView({ suppliers, search, setSearch, onAdd, onEdit, onDelete, loading, error }: SuppliersViewProps) {
  return (
    <>
      <PageHeading
        title="Fournisseurs"
        subtitle="Gérez vos fournisseurs et leurs informations de contact."
        action={
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            <Plus size={17} />
            Ajouter un fournisseur
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
              placeholder="Rechercher un fournisseur..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div className="text-sm text-slate-500">
            {suppliers.length} fournisseur{suppliers.length !== 1 ? 's' : ''}
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement des fournisseurs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        ) : (
          <SupplierTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>
    </>
  )
}
