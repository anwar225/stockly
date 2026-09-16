import { Plus, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { ProductTable } from './product-table'
import { categories } from '@/lib/stockly-data'
import type { Product } from '@/types'

interface ProductsViewProps {
  products: Product[]
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  onAdd: () => void
  onDelete: (product: Product) => void
  loading?: boolean
  error?: string | null
}

export function ProductsView({ products, search, setSearch, statusFilter, setStatusFilter, onAdd, onDelete, loading, error }: ProductsViewProps) {
  return (
    <>
      <PageHeading
        title="Produits"
        subtitle="Gérez votre catalogue de produits."
        action={
          <button
            onClick={onAdd}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            <Plus size={17} />
            Ajouter un produit
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
              placeholder="Rechercher un produit..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none">
              <option>Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="hidden h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none sm:block"
            >
              <option>Tous les statuts</option>
              <option>En stock</option>
              <option>Stock faible</option>
              <option>Rupture</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement des produits...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        ) : (
          <ProductTable products={products} onDelete={onDelete} />
        )}
      </div>
    </>
  )
}
