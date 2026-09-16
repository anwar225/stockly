'use client'

import { Package } from 'lucide-react'
import type { TopProduct } from '@/types/analytics.types'

interface AnalyticsProductsProps {
  topProducts: TopProduct[]
  loading: boolean
}

export function AnalyticsProducts({ topProducts, loading }: AnalyticsProductsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!topProducts || topProducts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Produits les plus vendus</h3>
        <div className="h-32 flex items-center justify-center text-slate-400">
          <p>Aucune vente sur cette période</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Produits les plus vendus</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Catégorie</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Quantité</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">CA</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product) => (
              <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                <td className="py-3 px-2 text-sm text-slate-900">{product.productName}</td>
                <td className="py-3 px-2 text-sm text-slate-600">{product.categoryName || '-'}</td>
                <td className="py-3 px-2 text-sm text-slate-900 text-right">{product.quantitySold}</td>
                <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">
                  {formatCurrency(product.revenue)} MAD
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
