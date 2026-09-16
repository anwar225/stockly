'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeading } from '@/components/shared/page-heading'
import { AnalyticsPeriodFilter } from './analytics-period-filter'
import { AnalyticsKpiCards } from './analytics-kpi-cards'
import { AnalyticsRevenueChart } from './analytics-revenue-chart'
import { AnalyticsProducts } from './analytics-products'
import { AnalyticsCategories } from './analytics-categories'
import { AnalyticsCustomers } from './analytics-customers'
import { AnalyticsStock } from './analytics-stock'
import { AnalyticsPayments } from './analytics-payments'
import type { OverviewAnalytics, SalesAnalytics, PeriodType } from '@/types/analytics.types'

export function AnalyticsView() {
  const [period, setPeriod] = useState<PeriodType>('month')
  const [customStartDate, setCustomStartDate] = useState<string>()
  const [customEndDate, setCustomEndDate] = useState<string>()
  const [overview, setOverview] = useState<OverviewAnalytics | null>(null)
  const [sales, setSales] = useState<SalesAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const overviewParams = period === 'custom'
        ? `?startDate=${customStartDate}&endDate=${customEndDate}`
        : `?period=${period}`

      const salesParams = period === 'custom'
        ? `?startDate=${customStartDate}&endDate=${customEndDate}`
        : `?period=${period}`

      const [overviewRes, salesRes] = await Promise.all([
        fetch(`/api/analytics/overview${overviewParams}`),
        fetch(`/api/analytics/sales${salesParams}`),
      ])

      if (!overviewRes.ok) {
        throw new Error('Impossible de charger les statistiques générales')
      }

      if (!salesRes.ok) {
        throw new Error('Impossible de charger les statistiques de ventes')
      }

      const overviewData = await overviewRes.json()
      const salesData = await salesRes.json()

      setOverview(overviewData)
      setSales(salesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period, customStartDate, customEndDate])

  const handlePeriodChange = (newPeriod: PeriodType, startDate?: string, endDate?: string) => {
    setPeriod(newPeriod)
    if (startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate(undefined)
      setCustomEndDate(undefined)
    }
  }

  const handleRetry = () => {
    fetchData()
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Analytics"
        subtitle="Vue d'ensemble de vos performances commerciales"
      />

      <AnalyticsPeriodFilter
        onPeriodChange={handlePeriodChange}
        defaultPeriod="month"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-900 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </button>
        </div>
      )}

      <AnalyticsKpiCards overview={overview} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsRevenueChart timeline={sales?.timeline || []} loading={loading} />
        <AnalyticsStock stock={overview?.stock || null} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsProducts topProducts={sales?.topProducts || []} loading={loading} />
        <AnalyticsCategories categories={sales?.categories || []} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCustomers topCustomers={sales?.topCustomers || []} loading={loading} />
        <AnalyticsPayments
          invoices={overview?.invoices || null}
          payments={overview?.payments || null}
          loading={loading}
        />
      </div>
    </div>
  )
}
