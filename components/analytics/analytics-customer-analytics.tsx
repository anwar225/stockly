'use client'

import { Users, ShoppingCart, DollarSign, TrendingUp, Activity, Mail, Phone } from 'lucide-react'
import type { CustomerAnalytics } from '@/types/analytics.types'

interface AnalyticsCustomerAnalyticsProps {
  customerAnalytics: CustomerAnalytics | null
  loading: boolean
}

export function AnalyticsCustomerAnalytics({ customerAnalytics, loading }: AnalyticsCustomerAnalyticsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!customerAnalytics) {
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

  return (
    <div className="space-y-6">
      {/* Section 1: KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Total clients</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(customerAnalytics.summary.totalCustomers)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Clients actifs</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(customerAnalytics.summary.activeCustomers)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Clients avec ventes</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(customerAnalytics.summary.customersWithSales)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">CA clients</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(customerAnalytics.summary.totalRevenue)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Nombre de ventes</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(customerAnalytics.summary.totalSales)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-slate-600">Panier moyen par client</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(customerAnalytics.summary.averageCustomerRevenue)} MAD</p>
        </div>
      </div>

      {/* Section 2: Top Customers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top clients</h3>
        {customerAnalytics.topCustomers.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucune vente sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Client</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Téléphone</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Ventes</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Produits achetés</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">CA</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Panier moyen</th>
                </tr>
              </thead>
              <tbody>
                {customerAnalytics.topCustomers.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{customer.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{customer.email || '-'}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{customer.phone || '-'}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(customer.salesCount)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(customer.productsBought)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(customer.revenue)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatCurrency(customer.averageOrderValue)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Customers Without Sales */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Clients sans vente sur la période</h3>
        {customerAnalytics.customersWithoutSales.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400">
            <p>Tous les clients ont effectué des ventes sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Client</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Téléphone</th>
                </tr>
              </thead>
              <tbody>
                {customerAnalytics.customersWithoutSales.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{customer.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{customer.email || '-'}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{customer.phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: All Customers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tous les clients</h3>
        {customerAnalytics.customers.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400">
            <p>Aucun client</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Client</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Ventes</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Produits achetés</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">CA</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Panier moyen</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Dernière vente</th>
                </tr>
              </thead>
              <tbody>
                {customerAnalytics.customers
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">{customer.name}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(customer.salesCount)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(customer.productsBought)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(customer.revenue)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatCurrency(customer.averageOrderValue)} MAD</td>
                    <td className="py-3 px-2 text-sm text-slate-600 text-right">{formatDate(customer.lastSaleDate)}</td>
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
