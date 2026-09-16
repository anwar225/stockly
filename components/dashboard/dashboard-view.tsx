import { Archive, BarChart3, Boxes, Package, SlidersHorizontal } from 'lucide-react'
import { Kpi } from './kpi-card'
import { StockChart } from './stock-chart'
import { RecentProducts } from './recent-products'
import type { Product } from '@/types'

type View = 'dashboard' | 'products' | 'categories' | 'brands' | 'stock' | 'movements' | 'settings' | 'soon'

interface DashboardViewProps {
  products: Product[]
  go: (view: View) => void
}

export function DashboardView({ products, go }: DashboardViewProps) {
  // Calculate KPIs from real PostgreSQL data
  const totalProducts = products.length
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const stockValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0)
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length

  // Format stock value in MAD
  const formattedStockValue = Math.round(stockValue).toLocaleString('fr-FR')

  // Calculate chart data from real products grouped by category
  const categoryStock = products.reduce((acc, product) => {
    const category = product.category || 'Non classé'
    acc[category] = (acc[category] || 0) + product.stock
    return acc
  }, {} as Record<string, number>)

  const chartData = Object.entries(categoryStock)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Sort products by createdAt (most recent first)
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold text-emerald-600">Jeudi 5 septembre 2026</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950">Bonjour, Anwar</h1>
        <p className="mt-1 text-sm text-slate-500">Voici un aperçu de votre magasin.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Produits" value={totalProducts.toString()} caption="Produits enregistrés" icon={Package} tone="green" />
        <Kpi label="Stock" value={totalStock.toString()} caption="Unités en stock" icon={Boxes} tone="blue" />
        <Kpi label="Valeur du stock" value={formattedStockValue} suffix="MAD" caption="Valeur totale estimée" icon={BarChart3} tone="purple" />
        <Kpi label="Stock faible" value={lowStock.toString()} caption="Produits nécessitant une attention" icon={SlidersHorizontal} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <StockChart data={chartData} />
        <RecentProducts products={recentProducts} />
      </div>
    </>
  )
}
