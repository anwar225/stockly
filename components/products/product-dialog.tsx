import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'
import type { ProductForm } from '@/types/product.types'
import type { Category, Brand } from '@/types/catalog.types'

const productSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  sku: z.string().min(2, 'La référence est requise'),
  brand: z.string().min(1, 'Choisissez une marque'),
  category: z.string().min(1, 'Choisissez une catégorie'),
  purchasePrice: z.number().positive('Prix invalide'),
  sellingPrice: z.number().positive('Prix invalide'),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  warranty: z.string().min(1, 'La garantie est requise'),
})

interface ProductDialogProps {
  form: ReturnType<typeof useForm<ProductForm>>
  onClose: () => void
  onSubmit: (data: ProductForm) => void
  isLoading?: boolean
  categories?: Category[]
  brands?: Brand[]
}

export function ProductDialog({ form, onClose, onSubmit, isLoading, categories = [], brands = [] }: ProductDialogProps) {
  const { register, handleSubmit, formState: { errors } } = form

  const input = (name: keyof ProductForm, label: string, type = 'text') => (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        {...register(name, {
          valueAsNumber: type === 'number',
        })}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      {errors[name] && <span className="text-xs text-rose-500">{errors[name]?.message as string}</span>}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Ajouter un produit</h2>
            <p className="mt-1 text-sm text-slate-500">Ajoutez une nouvelle référence à votre catalogue.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Informations générales</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {input('name', 'Nom du produit')}
              {input('sku', 'Référence / SKU')}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Classification</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Catégorie</span>
                <select
                  {...register('category')}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                {errors.category && <span className="text-xs text-rose-500">{errors.category.message as string}</span>}
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Marque</span>
                <select
                  {...register('brand')}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
                {errors.brand && <span className="text-xs text-rose-500">{errors.brand.message as string}</span>}
              </label>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Prix et stock</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {input('purchasePrice', 'Prix d\'achat', 'number')}
              {input('sellingPrice', 'Prix de vente', 'number')}
              {input('stock', 'Stock actuel', 'number')}
              {input('minStock', 'Stock minimum', 'number')}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-900">Informations additionnelles</h3>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-700">Garantie</span>
              <select
                {...register('warranty')}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="12 mois">12 mois</option>
                <option value="24 mois">24 mois</option>
                <option value="36 mois">36 mois</option>
                <option value="Sans garantie">Sans garantie</option>
              </select>
              {errors.warranty && <span className="text-xs text-rose-500">{errors.warranty.message as string}</span>}
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
                  Ajout...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Ajouter le produit
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
