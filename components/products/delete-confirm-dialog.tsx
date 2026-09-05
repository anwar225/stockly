import { Archive } from 'lucide-react'
import type { Product } from '@/types/product.types'

interface DeleteConfirmDialogProps {
  product: Product
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmDialog({ product, onClose, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
          <Archive size={20} />
        </div>
        <h2 className="mt-4 font-display text-lg font-bold">Supprimer ce produit ?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Vous êtes sur le point de supprimer <strong className="text-slate-700">{product.name}</strong>. Cette action est irréversible.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 text-sm font-semibold text-white hover:bg-rose-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
