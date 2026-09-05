import { Package } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Product } from '@/types/product.types'
import { getStatus } from '@/lib/stockly-data'

interface RecentProductsProps {
  products: Product[]
}

export function RecentProducts({ products }: RecentProductsProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold">Produits récents</h2>
          <p className="mt-1 text-xs text-slate-400">Derniers ajouts au catalogue</p>
        </div>
      </div>
      <div className="space-y-3">
        {products.slice(0, 5).map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Package size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
              <p className="text-xs text-slate-400">{product.brand}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{product.stock}</p>
              <StatusBadge status={getStatus(product)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
