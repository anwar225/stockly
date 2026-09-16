'use client'

import { DollarSign, ShoppingCart, Package, TrendingUp, Wallet, AlertTriangle, Box, AlertCircle } from 'lucide-react'
import { Kpi } from '@/components/dashboard/kpi-card'
import type { OverviewAnalytics } from '@/types/analytics.types'

interface AnalyticsKpiCardsProps {
  overview: OverviewAnalytics | null
  loading: boolean
}

export function AnalyticsKpiCards({ overview, loading }: AnalyticsKpiCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-3 bg-slate-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!overview) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Kpi
        label="Chiffre d'affaires"
        value={formatCurrency(overview.sales.revenue)}
        suffix="MAD"
        caption="Ventes confirmées"
        icon={DollarSign}
        tone="blue"
      />

      <Kpi
        label="Ventes confirmées"
        value={overview.sales.confirmedSalesCount.toString()}
        caption="Période sélectionnée"
        icon={ShoppingCart}
        tone="green"
      />

      <Kpi
        label="Produits vendus"
        value={overview.sales.productsSold.toString()}
        caption="Total quantités"
        icon={Package}
        tone="purple"
      />

      <Kpi
        label="Panier moyen"
        value={formatCurrency(overview.sales.averageBasket)}
        suffix="MAD"
        caption="Par vente"
        icon={TrendingUp}
        tone="amber"
      />

      <Kpi
        label="Montant encaissé"
        value={formatCurrency(overview.payments.collectedAmount)}
        suffix="MAD"
        caption="Période sélectionnée"
        icon={Wallet}
        tone="green"
      />

      <Kpi
        label="Impayé actuel"
        value={formatCurrency(overview.invoices.outstanding)}
        suffix="MAD"
        caption="Factures non payées"
        icon={AlertTriangle}
        tone="amber"
      />

      <Kpi
        label="Stock total"
        value={overview.stock.total.toString()}
        caption="Unités en stock"
        icon={Box}
        tone="blue"
      />

      <Kpi
        label="Ruptures"
        value={overview.stock.outOfStock.toString()}
        caption="Produits épuisés"
        icon={AlertCircle}
        tone="amber"
      />

      <Kpi
        label="Stock faible"
        value={overview.stock.lowStock.toString()}
        caption="Sous le minimum"
        icon={AlertTriangle}
        tone="purple"
      />
    </div>
  )
}
