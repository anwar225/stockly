'use client'

import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PaymentCreateInput } from '@/types/payment.types'

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'La facture est requise'),
  amount: z.number().positive('Le montant doit être positif').finite('Le montant doit être valide'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK']),
  paymentDate: z.string().min(1, 'La date de paiement est requise'),
  reference: z.string().optional(),
  externalReference: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: PaymentCreateInput) => Promise<void>
  invoiceId: string
  remainingAmount: number
  isSubmitting?: boolean
}

export function PaymentDialog({ open, onClose, onSubmit, invoiceId, remainingAmount, isSubmitting }: PaymentDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId,
      amount: 0,
      method: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      externalReference: '',
      notes: '',
    },
  })

  const onSubmitForm = async (data: PaymentFormData) => {
    if (data.amount > remainingAmount) {
      alert('Le montant du paiement dépasse le restant dû.')
      return
    }
    await onSubmit(data)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Ajouter un paiement</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="p-6">
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-500">Reste à payer</div>
              <div className="text-2xl font-semibold text-slate-900">
                {new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(remainingAmount)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Montant <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-xs text-rose-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Méthode de paiement <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('method')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              >
                <option value="CASH">Espèces</option>
                <option value="CARD">Carte</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="CHECK">Chèque</option>
              </select>
              {errors.method && (
                <p className="mt-1 text-xs text-rose-600">{errors.method.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Date du paiement <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                {...register('paymentDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-xs text-rose-600">{errors.paymentDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Référence
              </label>
              <input
                {...register('reference')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Référence optionnelle..."
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-rose-600">{errors.reference.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Référence externe
              </label>
              <input
                {...register('externalReference')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Référence externe optionnelle..."
              />
              {errors.externalReference && (
                <p className="mt-1 text-xs text-rose-600">{errors.externalReference.message}</p>
              )}
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
              {isSubmitting ? 'Traitement...' : 'Ajouter le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
