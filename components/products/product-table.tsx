import { Package, MoreHorizontal } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Product } from '@/types/product.types'
import { getStatus, formatMad } from '@/lib/stockly-data'

interface ProductTableProps {
  products: Product[]
  compact?: boolean
  onDelete?: (product: Product) => void
}

export function ProductTable({ products, compact = false, onDelete }: ProductTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400">
            <th className="px-5 py-3 font-medium">Produit</th>
            <th className="px-3 py-3 font-medium">Référence</th>
            <th className="px-3 py-3 font-medium">Catégorie</th>
            {!compact && <th className="px-3 py-3 font-medium">Prix de vente</th>}
            <th className="px-3 py-3 font-medium">Stock</th>
            <th className="px-3 py-3 font-medium">Statut</th>
            {onDelete && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Package size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{p.brand}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 font-mono text-xs text-slate-500">{p.sku}</td>
              <td className="px-3 py-4 text-slate-500">{p.category}</td>
              {!compact && <td className="px-3 py-4 font-medium text-slate-700">{formatMad(p.sellingPrice)}</td>}
              <td className="px-3 py-4 font-semibold text-slate-700">{p.stock}</td>
              <td className="px-3 py-4">
                <StatusBadge status={getStatus(p)} />
              </td>
              {onDelete && (
                <td className="px-5 py-4 text-right">
                  <button
                    aria-label={`Actions ${p.name}`}
                    onClick={() => onDelete(p)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <div className="p-12 text-center">
          <Package className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-600">Aucun produit trouvé</p>
          <p className="mt-1 text-xs text-slate-400">Essayez de modifier vos filtres de recherche</p>
        </div>
      )}
    </div>
  )
}
