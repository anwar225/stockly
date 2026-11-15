import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'

const categorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
})

interface CategoryForm {
  name: string
}

interface CategoryDialogProps {
  onClose: () => void
  onSubmit: (data: CategoryForm) => void
  isLoading?: boolean
}

export function CategoryDialog({ onClose, onSubmit, isLoading }: CategoryDialogProps) {
  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Ajouter une catégorie</h2>
            <p className="mt-1 text-sm text-slate-500">Créez une nouvelle catégorie pour organiser vos produits.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Nom de la catégorie</span>
            <input
              type="text"
              {...register('name')}
              placeholder="Ex: Électroménager"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
            {errors.name && <span className="text-xs text-rose-500">{errors.name.message}</span>}
          </label>
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
                  Ajouter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
