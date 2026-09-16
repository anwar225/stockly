import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { InvoiceCreateInput } from '@/types/invoice.types'
import type { Customer } from '@/types/customer.types'
import type { Sale } from '@/types/sale.types'

const invoiceSchema = z.object({
  saleId: z.string().min(1, 'La vente est requise'),
  invoiceDate: z.string().min(1, 'La date de facture est requise'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: InvoiceCreateInput) => Promise<void>
  customers: Customer[]
  sales: Sale[]
  isSubmitting?: boolean
}

export function InvoiceDialog({ open, onClose, onSubmit, customers, sales, isSubmitting }: InvoiceDialogProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      saleId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
    },
  })

  const selectedSale = sales.find((sale) => sale.id === watch('saleId'))

  const onSubmitForm = async (data: InvoiceFormData) => {
    await onSubmit(data)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Nouvelle facture</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Vente <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('saleId')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                <option value="">Sélectionner une vente</option>
                {sales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.reference} - {customers.find((c) => c.id === sale.customerId)?.name}
                  </option>
                ))}
              </select>
              {errors.saleId && (
                <p className="mt-1 text-xs text-rose-600">{errors.saleId.message}</p>
              )}
            </div>

            {selectedSale && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Client</div>
                    <div className="font-medium text-slate-900">
                      {customers.find((c) => c.id === selectedSale.customerId)?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Total</div>
                    <div className="font-medium text-slate-900">
                      {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(selectedSale.totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date de facture <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('invoiceDate')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                {errors.invoiceDate && (
                  <p className="mt-1 text-xs text-rose-600">{errors.invoiceDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-xs text-rose-600">{errors.dueDate.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 resize-none"
                placeholder="Notes optionnelles..."
              />
              {errors.notes && (
                <p className="mt-1 text-xs text-rose-600">{errors.notes.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
