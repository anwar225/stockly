import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Search, SlidersHorizontal, Plus } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { StatusBadge } from '@/components/shared/status-badge'
import { MovementDialog } from './movement-dialog'
import type { ApiMovement, MovementCreateInput } from '@/types/movement.types'
import type { Product } from '@/types/product.types'

const movementSchema = z.object({
  productId: z.string().min(1, 'Le produit est requis'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    message: 'Le type de mouvement est requis',
  }),
  quantity: z.number().int('La quantité doit être un entier'),
  reason: z.string().optional(),
}).refine((data) => {
  if (data.type === 'IN' || data.type === 'OUT') {
    return data.quantity > 0
  }
  return data.quantity >= 0
}, {
  message: 'Pour une entrée ou une sortie, la quantité doit être supérieure à 0',
  path: ['quantity'],
})

interface MovementsViewProps {
  products: Product[]
  onRefreshProducts: () => void
}

export function MovementsView({ products, onRefreshProducts }: MovementsViewProps) {
  const [movements, setMovements] = useState<ApiMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [movementModal, setMovementModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<MovementCreateInput>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      productId: '',
      type: 'IN',
      quantity: 0,
      reason: '',
    },
  })

  useEffect(() => {
    async function fetchMovements() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/movements')
        
        if (!response.ok) {
          throw new Error('Failed to fetch movements')
        }
        
        const apiMovements: ApiMovement[] = await response.json()
        setMovements(apiMovements)
      } catch (err) {
        console.error('Error fetching movements:', err)
        setError('Impossible de charger les mouvements')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMovements()
  }, [])

  const submitMovement = async (data: MovementCreateInput) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create movement')
      }
      
      const result = await response.json()
      
      // Refresh movements
      const movementsResponse = await fetch('/api/movements')
      if (movementsResponse.ok) {
        const apiMovements: ApiMovement[] = await movementsResponse.json()
        setMovements(apiMovements)
      }
      
      // Refresh products to update stock
      onRefreshProducts()
      
      setMovementModal(false)
      form.reset()
    } catch (err) {
      console.error('Error creating movement:', err)
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du mouvement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return 'Entrée'
      case 'OUT': return 'Sortie'
      case 'ADJUSTMENT': return 'Ajustement'
      default: return type
    }
  }

  return (
    <>
      <PageHeading
        title="Mouvements de stock"
        subtitle="Consultez l'historique des entrées et sorties."
        action={
          <button
            onClick={() => setMovementModal(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600"
          >
            <Plus size={17} />
            Nouveau mouvement
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              placeholder="Rechercher un produit..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
          <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>Tous les mouvements</option>
            <option>Entrée</option>
            <option>Sortie</option>
            <option>Ajustement</option>
          </select>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <SlidersHorizontal size={15} />
            Filtrer
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-slate-500">Chargement des mouvements...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Produit</th>
                  <th className="px-3 py-3 font-medium">Référence</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Quantité</th>
                  <th className="px-3 py-3 font-medium">Motif</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 font-semibold text-slate-800">{m.product.name}</td>
                    <td className="px-3 py-4 font-mono text-xs text-slate-500">{m.product.sku}</td>
                    <td className="px-3 py-4">
                      <StatusBadge status={getMovementTypeLabel(m.type)} />
                    </td>
                    <td className={`px-3 py-4 font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.quantity > 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td className="px-3 py-4 text-slate-500">{m.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {movementModal && (
        <MovementDialog
          form={form}
          onClose={() => setMovementModal(false)}
          onSubmit={submitMovement}
          isLoading={isSubmitting}
          products={products}
        />
      )}
    </>
  )
}
