'use client'

import { Box, AlertTriangle, AlertCircle } from 'lucide-react'
import type { StockAnalytics } from '@/types/analytics.types'

interface AnalyticsStockProps {
  stock: StockAnalytics | null
  loading: boolean
}

export function AnalyticsStock({ stock, loading }: AnalyticsStockProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!stock) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">État du stock</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Box className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stock.total}</p>
            <p className="text-xs text-slate-500">Stock total</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
          <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stock.lowStock}</p>
            <p className="text-xs text-slate-500">Stock faible</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stock.outOfStock}</p>
            <p className="text-xs text-slate-500">Ruptures</p>
          </div>
        </div>
      </div>
    </div>
  )
}
