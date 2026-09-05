import { Plus, Search, MoreHorizontal } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { StatusBadge } from '@/components/shared/status-badge'
import type { Brand } from '@/types'

interface BrandsViewProps {
  brands: Brand[]
}

export function BrandsView({ brands }: BrandsViewProps) {
  const rows = brands.map((b) => [b.name, `${b.count} produit${b.count > 1 ? 's' : ''}`, 'Actif'])

  return (
    <>
      <PageHeading
        title="Marques"
        subtitle="Gérez les marques disponibles dans votre magasin."
        action={
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600">
            <Plus size={17} />
            Ajouter une marque
          </button>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              placeholder="Rechercher une marque..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-5 py-3 font-medium">Marque</th>
                <th className="px-5 py-3 font-medium">Produits</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-5 py-4 ${j === 0 ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                      {cell === 'Actif' ? <StatusBadge status="En stock" /> : cell}
                    </td>
                  ))}
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
