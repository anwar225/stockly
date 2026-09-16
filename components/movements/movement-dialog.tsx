import { useForm } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import type { MovementCreateInput, Product } from '@/types'

interface MovementDialogProps {
  form: ReturnType<typeof useForm<MovementCreateInput>>
  onClose: () => void
  onSubmit: (data: MovementCreateInput) => void
  isLoading?: boolean
  products: Product[]
}

export function MovementDialog({ form, onClose, onSubmit, isLoading, products }: MovementDialogProps) {
  const { register, handleSubmit, formState: { errors } } = form

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return 'Entrée'
      case 'OUT': return 'Sortie'
      case 'ADJUSTMENT': return 'Ajustement'
      default: return type
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Nouveau mouvement de stock</h2>
            <p className="mt-1 text-sm text-slate-500">Enregistrez une entrée, sortie ou ajustement de stock.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Produit</span>
              <select
                {...register('productId')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Sélectionner un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - Stock: {p.stock}
                  </option>
                ))}
              </select>
              {errors.productId && <span className="text-xs text-rose-500">{errors.productId.message as string}</span>}
            </label>
          </div>
          <div>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Type de mouvement</span>
              <select
                {...register('type')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="IN">Entrée (+stock)</option>
                <option value="OUT">Sortie (-stock)</option>
                <option value="ADJUSTMENT">Ajustement (définit le stock)</option>
              </select>
              {errors.type && <span className="text-xs text-rose-500">{errors.type.message as string}</span>}
            </label>
          </div>
          <div>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Quantité</span>
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                min="0"
              />
              {errors.quantity && <span className="text-xs text-rose-500">{errors.quantity.message as string}</span>}
            </label>
          </div>
          <div>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Motif (optionnel)</span>
              <input
                type="text"
                {...register('reason')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Réception fournisseur, Vente, Inventaire..."
              />
              {errors.reason && <span className="text-xs text-rose-500">{errors.reason.message as string}</span>}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Enregistrer le mouvement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
