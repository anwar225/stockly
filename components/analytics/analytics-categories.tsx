'use client'

import { Tag } from 'lucide-react'
import type { CategoryAnalytics } from '@/types/analytics.types'

interface AnalyticsCategoriesProps {
  categories: CategoryAnalytics[]
  loading: boolean
}

export function AnalyticsCategories({ categories, loading }: AnalyticsCategoriesProps) {
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

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance par catégorie</h3>
        <div className="h-32 flex items-center justify-center text-slate-400">
          <p>Aucune donnée sur cette période</p>
        </div>
      </div>
    )
  }

  const maxRevenue = Math.max(...categories.map(c => c.revenue))

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance par catégorie</h3>
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.categoryId}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">{category.categoryName}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(category.revenue)} MAD
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({category.quantitySold} vendus)
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-slate-900 h-2 rounded-full transition-all"
                style={{ width: `${(category.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
