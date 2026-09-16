import { AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  customerName: string
  isDeleting?: boolean
}

export function DeleteConfirmDialog({ isOpen, onClose, onConfirm, customerName, isDeleting }: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100">
              <AlertTriangle className="text-rose-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800">Supprimer le client</h3>
              <p className="mt-2 text-sm text-slate-600">
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-slate-800">{customerName}</span> ?
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cette action est irréversible. Le client sera définitivement supprimé.
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
              disabled={isDeleting}
              className="h-10 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:bg-rose-600 disabled:opacity-50"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
