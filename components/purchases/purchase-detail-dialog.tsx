import { X, Package, Calendar, Building2, ShoppingBag, CheckCircle, ArrowRightCircle } from 'lucide-react'
import { PurchaseStatusBadge } from './purchase-status-badge'
import type { Purchase } from '@/types/purchase.types'

interface PurchaseDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  purchase: Purchase | null
  onOrder: () => void
  onReceiveRequest: () => void
  isProcessing?: boolean
}

export function PurchaseDetailDialog({ isOpen, onClose, purchase, onOrder, onReceiveRequest, isProcessing }: PurchaseDetailDialogProps) {
  if (!isOpen || !purchase) return null

  const canOrder = purchase.status === 'DRAFT'
  const canReceive = purchase.status === 'ORDERED'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Détail de l'achat</h2>
            <p className="text-sm text-slate-500">{purchase.reference}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <Building2 size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Fournisseur</p>
                <p className="text-sm font-semibold text-slate-800">{purchase.supplier?.name || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <Calendar size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(purchase.purchaseDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <ShoppingBag size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Statut</p>
                <PurchaseStatusBadge status={purchase.status} />
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700">{purchase.notes}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Articles</h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Produit</th>
                    <th className="px-4 py-2 text-left font-medium w-20">Quantité</th>
                    <th className="px-4 py-2 text-left font-medium w-28">Prix unitaire</th>
                    <th className="px-4 py-2 text-left font-medium w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchase.items?.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">{item.product?.name}</p>
                          <p className="text-xs text-slate-500">{item.product?.sku}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{item.unitPrice.toLocaleString('fr-FR')} MAD</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.total.toLocaleString('fr-FR')} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-6 py-4">
            <div className="flex items-center gap-2">
              <Package size={20} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">Total général</span>
            </div>
            <span className="text-xl font-bold text-emerald-900">
              {purchase.totalAmount.toLocaleString('fr-FR')} MAD
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {canOrder && (
              <button
                onClick={onOrder}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-600 disabled:opacity-50"
              >
                <ArrowRightCircle size={18} />
                Commander
              </button>
            )}
            {canReceive && (
              <button
                onClick={onReceiveRequest}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50"
              >
                <CheckCircle size={18} />
                Réceptionner
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
