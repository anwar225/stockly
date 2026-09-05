import { Search, SlidersHorizontal } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { StatusBadge } from '@/components/shared/status-badge'
import { movements } from '@/lib/stockly-data'

export function MovementsView() {
  return (
    <>
      <PageHeading title="Mouvements de stock" subtitle="Consultez l'historique des entrées et sorties." />
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
                <th className="px-3 py-3 font-medium">Utilisateur</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                  <td className="px-5 py-4 text-slate-500">{m.date}</td>
                  <td className="px-3 py-4 font-semibold text-slate-800">{m.product}</td>
                  <td className="px-3 py-4 font-mono text-xs text-slate-500">{m.sku}</td>
                  <td className="px-3 py-4">
                    <StatusBadge status={m.type} />
                  </td>
                  <td className={`px-3 py-4 font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.quantity > 0 ? '+' : ''}{m.quantity}
                  </td>
                  <td className="px-3 py-4 text-slate-500">{m.reason}</td>
                  <td className="px-3 py-4 text-slate-500">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
