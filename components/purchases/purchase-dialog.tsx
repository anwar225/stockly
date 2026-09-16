import { X, Plus, Trash2, Package } from 'lucide-react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Product, Supplier } from '@/types'
import type { PurchaseFormData, PurchaseItemFormData } from '@/types/purchase.types'

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Le produit est requis'),
  quantity: z.number().int().positive('La quantité doit être positive'),
  unitPrice: z.number().nonnegative('Le prix doit être positif'),
})

const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Le fournisseur est requis'),
  purchaseDate: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'Au moins un article est requis'),
})

type PurchaseFormValues = z.infer<typeof purchaseSchema>

interface PurchaseDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PurchaseFormData) => void
  products: Product[]
  suppliers: Supplier[]
  isSubmitting?: boolean
}

export function PurchaseDialog({ isOpen, onClose, onSubmit, products, suppliers, isSubmitting }: PurchaseDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const formItems = useWatch({
    control,
    name: 'items',
  })

  const onSubmitForm = async (data: PurchaseFormValues) => {
    await onSubmit(data)
    reset()
  }

  const addItem = () => {
    append({ productId: '', quantity: 1, unitPrice: 0 })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const calculateLineTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice
  }

  const calculateTotal = (items: PurchaseItemFormData[]) => {
    return items.reduce((sum, item) => sum + calculateLineTotal(item.quantity, item.unitPrice), 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Nouvel achat</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Fournisseur <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('supplierId')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Sélectionner un fournisseur</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="mt-1 text-xs text-rose-500">{errors.supplierId.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('purchaseDate')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
              {errors.purchaseDate && <p className="mt-1 text-xs text-rose-500">{errors.purchaseDate.message}</p>}
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              placeholder="Notes supplémentaires..."
            />
            {errors.notes && <p className="mt-1 text-xs text-rose-500">{errors.notes.message}</p>}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-700">Articles</label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                <Plus size={14} />
                Ajouter un article
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Produit</th>
                    <th className="px-3 py-2 text-left font-medium w-24">Quantité</th>
                    <th className="px-3 py-2 text-left font-medium w-32">Prix unitaire</th>
                    <th className="px-3 py-2 text-left font-medium w-28">Total</th>
                    <th className="px-3 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <select
                          {...register(`items.${index}.productId`)}
                          className="h-9 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-emerald-400"
                        >
                          <option value="">Sélectionner</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.productId && (
                          <p className="mt-1 text-xs text-rose-500">{errors.items[index]?.productId?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          min="1"
                          step="1"
                          className="h-9 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-emerald-400"
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="mt-1 text-xs text-rose-500">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                          min="0"
                          step="0.01"
                          className="h-9 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-emerald-400"
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="mt-1 text-xs text-rose-500">{errors.items[index]?.unitPrice?.message}</p>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-700">
                        {calculateLineTotal(formItems[index]?.quantity || 0, formItems[index]?.unitPrice || 0).toLocaleString('fr-FR')} MAD
                      </td>
                      <td className="px-3 py-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {errors.items && !Array.isArray(errors.items) && (
              <p className="mt-1 text-xs text-rose-500">{errors.items.message}</p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Total général</span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {calculateTotal(formItems).toLocaleString('fr-FR')} MAD
            </span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer l\'achat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
