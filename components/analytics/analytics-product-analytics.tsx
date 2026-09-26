'use client'

import { Package, TrendingUp, ShoppingCart, AlertTriangle, Activity, DollarSign } from 'lucide-react'
import type { ProductAnalytics } from '@/types/analytics.types'

interface AnalyticsProductAnalyticsProps {
  productAnalytics: ProductAnalytics | null
  loading: boolean
}

export function AnalyticsProductAnalytics({ productAnalytics, loading }: AnalyticsProductAnalyticsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!productAnalytics) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-MA').format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">En stock</span>
      case 'LOW_STOCK':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">Stock faible</span>
      case 'OUT_OF_STOCK':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rupture</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Section 1: KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Produits</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(productAnalytics.summary.totalProducts)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Produits actifs</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(productAnalytics.summary.activeProducts)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Produits vendus</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(productAnalytics.summary.productsSold)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">CA produits</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(productAnalytics.summary.totalRevenue)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Quantité vendue</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(productAnalytics.summary.totalQuantitySold)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Quantité achetée</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(productAnalytics.summary.totalPurchasedQuantity)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Montant achats</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(productAnalytics.summary.totalReceivedPurchaseAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Ventes moyennes</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">
            {productAnalytics.summary.productsSold > 0
              ? formatNumber(productAnalytics.summary.totalQuantitySold / productAnalytics.summary.productsSold)
              : '0'}
          </p>
        </div>
      </div>

      {/* Section 2: Top Products */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top produits</h3>
        {productAnalytics.topProducts.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucune vente sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Catégorie</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Marque</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Quantité vendue</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">CA</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Ventes</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productAnalytics.topProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.name}</td>
                  <td className="py-3 px-2 text-sm text-slate-600">{product.category?.name || '-'}</td>
                  <td className="py-3 px-2 text-sm text-slate-600">{product.brand?.name || '-'}</td>
                    <td className="py-3 px-2 text-sm text-slate-900">{formatNumber(product.quantitySold)}</td>
                  <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(product.revenue)} MAD</td>
                  <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.salesCount)}</td>
                  <td className="py-3 px-2 text-sm text-slate-900 text-right">{getStockStatusBadge(product.stockStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Stock Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Stock faible
          </h3>
          {productAnalytics.lowStockProducts.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <p>Aucun produit en stock faible</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock min</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.lowStockProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.stock)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.minStock)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{getStockStatusBadge(product.stockStatus)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Out of Stock */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Rupture de stock
          </h3>
          {productAnalytics.outOfStockProducts.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-slate-400">
              <p>Aucune rupture de stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock min</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {productAnalytics.outOfStockProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.stock)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.minStock)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{getStockStatusBadge(product.stockStatus)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Products Without Sales */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Produits sans vente (période)</h3>
        {productAnalytics.productsWithoutSales.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400">
            <p>Tous les produits ont été vendus sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Catégorie</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Dernière vente</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Dernier achat</th>
                </tr>
              </thead>
              <tbody>
                {productAnalytics.productsWithoutSales.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{product.category?.name || '-'}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.stock)}</td>
                    <td className="py-3 px-2 text-sm text-slate-600 text-right">{formatDate(product.lastSaleDate)}</td>
                    <td className="py-3 px-2 text-sm text-slate-600 text-right">{formatDate(product.lastPurchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5: All Products Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Achats / Ventes par produit</h3>
        {productAnalytics.products.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400">
            <p>Aucun produit</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Qté vendue</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">CA</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Qté achetée</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Achats reçus</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productAnalytics.products.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.quantitySold)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(product.revenue)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(product.purchasedQuantity)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatCurrency(product.receivedPurchaseAmount)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{getStockStatusBadge(product.stockStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
