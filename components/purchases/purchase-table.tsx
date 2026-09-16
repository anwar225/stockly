import { ShoppingBag, ShoppingCart, Calendar, Package2, MoreHorizontal } from 'lucide-react'
import { PurchaseStatusBadge } from './purchase-status-badge'
import type { Purchase } from '@/types/purchase.types'

interface PurchaseTableProps {
  purchases: Purchase[]
  onViewDetail: (purchase: Purchase) => void
}

export function PurchaseTable({ purchases, onViewDetail }: PurchaseTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400">
            <th className="px-5 py-3 font-medium">Référence</th>
            <th className="px-3 py-3 font-medium">Fournisseur</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Articles</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Statut</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <ShoppingBag size={16} />
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-slate-800">{purchase.reference}</p>
                    {purchase.notes && (
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{purchase.notes}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 text-slate-500">{purchase.supplier?.name || '-'}</td>
              <td className="px-3 py-4 text-slate-500">
                {new Date(purchase.purchaseDate).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-3 py-4 text-slate-500">
                <div className="flex items-center gap-1">
                  <Package2 size={14} />
                  <span>{purchase.items?.length || 0} article{purchase.items?.length !== 1 ? 's' : ''}</span>
                </div>
              </td>
              <td className="px-3 py-4 font-semibold text-slate-700">
                {purchase.totalAmount.toLocaleString('fr-FR')} MAD
              </td>
              <td className="px-3 py-4">
                <PurchaseStatusBadge status={purchase.status} />
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => onViewDetail(purchase)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Voir le détail"
                >
                  <MoreHorizontal size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {purchases.length === 0 && (
        <div className="p-12 text-center">
          <ShoppingCart className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-600">Aucun achat trouvé</p>
          <p className="mt-1 text-xs text-slate-400">Commencez par créer votre premier achat</p>
        </div>
      )}
    </div>
  )
}
