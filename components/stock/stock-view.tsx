import { Package, Boxes, SlidersHorizontal, Archive, Search } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { ProductTable } from '@/components/products/product-table'
import { Kpi } from '@/components/dashboard/kpi-card'
import type { Product } from '@/types'

interface StockViewProps {
  products: Product[]
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
}

export function StockView({ products, search, setSearch, statusFilter, setStatusFilter }: StockViewProps) {
  return (
    <>
      <PageHeading title="Gestion du stock" subtitle="Suivez les niveaux de stock de votre magasin." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total produits" value="245" caption="Références actives" icon={Package} tone="green" />
        <Kpi label="Total unités" value="1 240" caption="Dans tous les magasins" icon={Boxes} tone="blue" />
        <Kpi label="Stock faible" value="12" caption="À réapprovisionner" icon={SlidersHorizontal} tone="amber" />
        <Kpi label="Rupture" value="4" caption="Action immédiate" icon={Archive} tone="purple" />
      </div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
          >
            <option>Tous les statuts</option>
            <option>En stock</option>
            <option>Stock faible</option>
            <option>Rupture</option>
          </select>
        </div>
        <ProductTable products={products} compact />
      </div>
    </>
  )
}
