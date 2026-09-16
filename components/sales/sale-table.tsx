import { ShoppingCart, Eye } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { SaleListItem } from '@/types/sale.types'

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
}

interface SaleTableProps {
  sales: SaleListItem[]
  onView: (saleListItem: SaleListItem) => void
}

export function SaleTable({ sales, onView }: SaleTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs text-slate-400">
            <th className="px-5 py-3 font-medium">Référence</th>
            <th className="px-3 py-3 font-medium">Client</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Articles</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Statut</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {sales.map((saleListItem) => (
            <tr key={saleListItem.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <ShoppingCart size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{saleListItem.reference}</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 text-slate-500">{saleListItem.customerName}</td>
              <td className="px-3 py-4 text-slate-500">
                {new Date(saleListItem.saleDate).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-3 py-4 text-slate-500">{saleListItem.itemsCount} article(s)</td>
              <td className="px-3 py-4 text-slate-500">{saleListItem.totalAmount.toLocaleString()} MAD</td>
              <td className="px-3 py-4">
                <StatusBadge status={statusLabels[saleListItem.status]} />
              </td>
              <td className="px-5 py-4 text-right">
                <button
                  onClick={() => onView(saleListItem)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                  title="Voir le détail"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sales.length === 0 && (
        <div className="p-12 text-center">
          <ShoppingCart className="mx-auto text-slate-300" size={28} />
          <p className="mt-3 text-sm font-semibold text-slate-600">Aucune vente trouvée</p>
          <p className="mt-1 text-xs text-slate-400">Commencez par créer votre première vente</p>
        </div>
      )}
    </div>
  )
}
