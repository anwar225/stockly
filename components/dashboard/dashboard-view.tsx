import { Archive, BarChart3, Boxes, Package, SlidersHorizontal } from 'lucide-react'
import { Kpi } from './kpi-card'
import { StockChart } from './stock-chart'
import { RecentProducts } from './recent-products'
import { chartData } from '@/lib/stockly-data'
import type { Product } from '@/types'

type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'stock' | 'movements' | 'settings' | 'soon'

interface DashboardViewProps {
  products: Product[]
  go: (view: View) => void
}

export function DashboardView({ products, go }: DashboardViewProps) {
  return (
    <>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold text-emerald-600">Jeudi 5 septembre 2026</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">Bonjour, Anwar</h1>
        <p className="mt-1 text-sm text-slate-500">Voici un aperçu de votre magasin.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Produits" value="245" caption="Produits enregistrés" icon={Package} tone="green" />
        <Kpi label="Stock" value="1 240" caption="Unités en stock" icon={Boxes} tone="blue" />
        <Kpi label="Valeur du stock" value="850 000" suffix="MAD" caption="Valeur totale estimée" icon={BarChart3} tone="purple" />
        <Kpi label="Stock faible" value="12" caption="Produits nécessitant une attention" icon={SlidersHorizontal} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <StockChart data={chartData} />
        <RecentProducts products={products} />
      </div>
    </>
  )
}
