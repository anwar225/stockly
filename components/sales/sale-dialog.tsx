import { X, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Customer } from '@/types/customer.types'
import type { ApiProduct } from '@/types/product.types'
import type { SaleCreateInput, SaleCreateItem } from '@/types/sale.types'

const saleSchema = z.object({
  customerId: z.string().min(1, 'Le client est requis'),
  saleDate: z.string().min(1, 'La date est requise'),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Le produit est requis'),
      quantity: z.number().int().positive('La quantité doit être positive'),
    })
  ).min(1, 'Au moins un article est requis'),
})

type SaleFormData = z.infer<typeof saleSchema>

interface SaleDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: SaleCreateInput) => Promise<void>
  customers: Customer[]
  products: ApiProduct[]
  isSubmitting?: boolean
}

export function SaleDialog({ isOpen, onClose, onSubmit, customers, products, isSubmitting }: SaleDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: '',
      saleDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', quantity: 1 }],
    },
  })

  const items = watch('items')

  const addItem = () => {
    setValue('items', [...items, { productId: '', quantity: 1 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setValue('items', items.filter((_, i) => i !== index))
    }
  }

  const getLineTotal = (index: number) => {
    const item = items[index]
    const product = products.find((p) => p.id === item.productId)
    return product ? item.quantity * Number(product.sellingPrice) : 0
  }

  const getTotal = () => {
    return items.reduce((sum, item, index) => sum + getLineTotal(index), 0)
  }

  const onSubmitForm = async (data: SaleFormData) => {
    // Check for duplicate products
    const productIds = data.items.map((item) => item.productId)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      alert('Un produit ne peut apparaître qu\'une seule fois dans une vente.')
      return
    }

    await onSubmit(data)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Nouvelle vente</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Client <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('customerId')}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="">Sélectionner un client</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </option>
                  ))}
                </select>
                {errors.customerId && <p className="mt-1 text-xs text-rose-500">{errors.customerId.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('saleDate')}
                  type="date"
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
                {errors.saleDate && <p className="mt-1 text-xs text-rose-500">{errors.saleDate.message}</p>}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="Notes supplémentaires..."
              />
              {errors.notes && <p className="mt-1 text-xs text-rose-500">{errors.notes.message}</p>}
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Articles</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  <Plus size={14} />
                  Ajouter un produit
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-slate-600">Produit</label>
                      <select
                        {...register(`items.${index}.productId`)}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="">Sélectionner un produit</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {Number(product.sellingPrice).toLocaleString()} MAD (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && (
                        <p className="mt-1 text-xs text-rose-500">{errors.items[index]?.productId?.message}</p>
                      )}
                    </div>
                    <div className="w-24">
                      <label className="mb-1 block text-xs text-slate-600">Quantité</label>
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-xs text-rose-500">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </div>
                    <div className="w-32 pt-5">
                      <p className="text-sm font-semibold text-slate-700">
                        {getLineTotal(index).toLocaleString()} MAD
                      </p>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-5 rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.items && typeof errors.items.message === 'string' && (
                <p className="mt-1 text-xs text-rose-500">{errors.items.message}</p>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-semibold text-slate-800">{getTotal().toLocaleString()} MAD</p>
              </div>
            </div>
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
              {isSubmitting ? 'Création...' : 'Créer la vente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
