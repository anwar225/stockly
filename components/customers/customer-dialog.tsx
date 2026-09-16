import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Customer } from '@/types/customer.types'

const customerSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').trim(),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomerFormData) => Promise<void>
  customer?: Customer | null
  isSubmitting?: boolean
}

export function CustomerDialog({ isOpen, onClose, onSubmit, customer, isSubmitting }: CustomerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          name: customer.name,
          phone: customer.phone || '',
          email: customer.email || '',
          address: customer.address || '',
          notes: customer.notes || '',
        }
      : {
          name: '',
          phone: '',
          email: '',
          address: '',
          notes: '',
        },
  })

  const onSubmitForm = async (data: CustomerFormData) => {
    await onSubmit(data)
    reset()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {customer ? 'Modifier le client' : 'Ajouter un client'}
          </h2>
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
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Nom <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('name')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="Nom du client"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Téléphone</label>
              <input
                {...register('phone')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="06 00 00 00 00"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Email</label>
              <input
                {...register('email')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="client@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Adresse</label>
              <input
                {...register('address')}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="Adresse complète"
              />
              {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="Notes supplémentaires..."
              />
              {errors.notes && <p className="mt-1 text-xs text-rose-500">{errors.notes.message}</p>}
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
              {isSubmitting ? 'Enregistrement...' : customer ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
