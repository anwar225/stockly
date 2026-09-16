import { Package, AlertTriangle } from 'lucide-react'

interface ReceiveConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  purchaseReference: string
  isReceiving?: boolean
}

export function ReceiveConfirmDialog({ isOpen, onClose, onConfirm, purchaseReference, isReceiving }: ReceiveConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Package className="text-emerald-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">Confirmer la réception</h3>
              <p className="mt-2 text-sm text-slate-600">
                Êtes-vous sûr de vouloir réceptionner l'achat <span className="font-semibold text-slate-800">{purchaseReference}</span> ?
              </p>
              <p className="mt-2 text-xs text-slate-500 bg-slate-50 rounded px-3 py-2">
                ⚠️ Les quantités des articles seront automatiquement ajoutées au stock.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isReceiving}
              className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50"
            >
              {isReceiving ? 'Réception...' : 'Confirmer la réception'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
