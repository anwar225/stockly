import { X, CheckCircle, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Sale } from '@/types/sale.types'

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
}

interface SaleDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale
  onConfirm: (saleId: string) => void
  onCancel: (saleId: string) => void
}

export function SaleDetailDialog({ isOpen, onClose, sale, onConfirm, onCancel }: SaleDetailDialogProps) {
  if (!isOpen) return null

  const canConfirm = sale.status === 'DRAFT'
  const canCancel = sale.status === 'DRAFT'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Détail de la vente</h2>
            <p className="text-sm text-slate-500">{sale.reference}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Statut</p>
              <div className="mt-1">
                <StatusBadge status={statusLabels[sale.status]} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{sale.customer.name}</p>
              {sale.customer.phone && (
                <p className="text-xs text-slate-500">{sale.customer.phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {new Date(sale.saleDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {sale.totalAmount.toLocaleString()} MAD
              </p>
            </div>
          </div>

          {sale.notes && (
            <div className="mb-6">
              <p className="text-xs text-slate-500">Notes</p>
              <p className="mt-1 text-sm text-slate-700">{sale.notes}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Articles</h3>
            <div className="rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                    <th className="px-4 py-2 text-left">Produit</th>
                    <th className="px-4 py-2 text-center">Quantité</th>
                    <th className="px-4 py-2 text-right">Prix unitaire</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">{item.unitPrice.toLocaleString()} MAD</td>
                      <td className="px-4 py-3 text-right font-semibold">{item.total.toLocaleString()} MAD</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold text-slate-700">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {sale.totalAmount.toLocaleString()} MAD
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            {canConfirm && (
              <button
                onClick={() => onConfirm(sale.id)}
                className="flex items-center gap-2 h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
              >
                <CheckCircle size={16} />
                Confirmer la vente
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => onCancel(sale.id)}
                className="flex items-center gap-2 h-10 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <XCircle size={16} />
                Annuler la vente
              </button>
            )}
            <button
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
