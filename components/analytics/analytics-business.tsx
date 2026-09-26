'use client'

import { DollarSign, ShoppingCart, TrendingUp, Package, Users, Truck, AlertTriangle, CheckCircle } from 'lucide-react'
import type { BusinessAnalytics } from '@/types/analytics.types'

interface AnalyticsBusinessProps {
  business: BusinessAnalytics | null
  loading: boolean
}

export function AnalyticsBusiness({ business, loading }: AnalyticsBusinessProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!business) {
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

  const calculateRatio = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0
    return ((numerator / denominator) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">CA ventes</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(business.sales.revenue)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Achats reçus</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(business.purchases.receivedAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Encaissements</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(business.payments.collectedAmount)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Impayés</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(business.payments.outstandingAmount)} MAD</p>
        </div>
      </div>

      {/* Section 2: Activity Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Ventes confirmées</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.sales.confirmedSales)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Achats reçus</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.purchases.receivedPurchases)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Clients</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.activity.customers)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Fournisseurs</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.activity.suppliers)}</p>
        </div>
      </div>

      {/* Section 3: Stock Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Stock total</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.stock.totalStock)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">Stock faible</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.stock.lowStock)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Ruptures</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.stock.outOfStock)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Produits</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(business.activity.products)}</p>
        </div>
      </div>

      {/* Section 4: Ratios */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Ratios clés</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Ratio CA / Achats</span>
            <span className="text-lg font-semibold text-slate-900">
              {calculateRatio(business.sales.revenue, business.purchases.receivedAmount)}%
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-600">Ratio Encaissements / Impayés</span>
            <span className="text-lg font-semibold text-slate-900">
              {calculateRatio(business.payments.collectedAmount, business.payments.outstandingAmount)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
