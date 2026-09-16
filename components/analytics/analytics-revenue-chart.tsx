'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { TimelinePoint } from '@/types/analytics.types'

interface AnalyticsRevenueChartProps {
  timeline: TimelinePoint[]
  loading: boolean
}

export function AnalyticsRevenueChart({ timeline, loading }: AnalyticsRevenueChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-slate-200 rounded animate-pulse"></div>
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const hasData = timeline && timeline.length > 0 && timeline.some(t => t.revenue > 0)

  if (!hasData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Évolution du chiffre d'affaires</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          <p>Aucune donnée sur cette période</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Évolution du chiffre d'affaires</h3>
      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={timeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value: any) => [formatCurrency(Number(value)) + ' MAD', 'CA']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ fill: '#0f172a', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
