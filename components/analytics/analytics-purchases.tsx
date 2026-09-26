'use client'

import { ShoppingCart, Package, TrendingUp } from 'lucide-react'
import type { PurchaseAnalytics } from '@/types/analytics.types'

interface AnalyticsPurchasesProps {
  purchases: PurchaseAnalytics | null
  loading: boolean
}

export function AnalyticsPurchases({ purchases, loading }: AnalyticsPurchasesProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!purchases) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Achats reçus</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{purchases.summary.receivedPurchases}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Montant reçu</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(purchases.summary.totalReceivedAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">Panier moyen</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(purchases.summary.averageReceivedPurchaseAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Achats commandés</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{purchases.summary.orderedPurchases}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Montant commandé</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(purchases.summary.totalOrderedAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-600">Total achats</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{purchases.summary.totalPurchases}</p>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top fournisseurs</h3>
        {purchases.topSuppliers.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucun achat sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Fournisseur</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Achats</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Commandés</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Reçus</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant commandé</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant reçu</th>
                </tr>
              </thead>
              <tbody>
                {purchases.topSuppliers.map((supplier) => (
                  <tr key={supplier.supplierId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{supplier.supplierName}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{supplier.purchaseCount}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{supplier.orderedCount}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{supplier.receivedCount}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatCurrency(supplier.totalOrderedAmount)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(supplier.totalReceivedAmount)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchased Products */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Produits achetés</h3>
        {purchases.purchasedProducts.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucun achat sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Produit</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Qté commandée</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Qté reçue</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant commandé</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant reçu</th>
                </tr>
              </thead>
              <tbody>
                {purchases.purchasedProducts.map((product) => (
                  <tr key={product.productId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{product.productName}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{product.quantityOrdered}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{product.quantityReceived}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatCurrency(product.totalOrderedAmount)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(product.totalReceivedAmount)} MAD</td>
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
