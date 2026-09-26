'use client'

import { useState } from 'react'
import { Download, FileText, Package, Users, ShoppingCart, Wallet, ClipboardCheck, TrendingUp } from 'lucide-react'
import type { PeriodType } from '@/types/analytics.types'

interface AnalyticsExportButtonsProps {
  period: PeriodType
  customStartDate?: string
  customEndDate?: string
}

export function AnalyticsExportButtons({ period, customStartDate, customEndDate }: AnalyticsExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const buildExportUrl = (endpoint: string) => {
    const baseUrl = `/api/analytics/export/${endpoint}`
    if (period === 'custom' && customStartDate && customEndDate) {
      return `${baseUrl}?startDate=${customStartDate}&endDate=${customEndDate}`
    }
    return `${baseUrl}?period=${period}`
  }

  const handleExport = async (endpoint: string, label: string) => {
    setExporting(label)

    try {
      const url = buildExportUrl(endpoint)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'stockly-export.csv'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setExporting(null)
    }
  }

  const exportButtons = [
    {
      label: 'Ventes',
      endpoint: 'sales',
      icon: <ShoppingCart className="h-4 w-4" />,
      description: 'Exporter les ventes confirmées',
    },
    {
      label: 'Achats',
      endpoint: 'purchases',
      icon: <Package className="h-4 w-4" />,
      description: 'Exporter les achats reçus',
    },
    {
      label: 'Clients',
      endpoint: 'customers',
      icon: <Users className="h-4 w-4" />,
      description: 'Exporter les clients et leurs métriques',
    },
    {
      label: 'Produits',
      endpoint: 'products',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Exporter les produits et leurs performances',
    },
    {
      label: 'Stock',
      endpoint: 'stock',
      icon: <ClipboardCheck className="h-4 w-4" />,
      description: 'Exporter l\'état actuel du stock',
    },
    {
      label: 'Factures',
      endpoint: 'invoices',
      icon: <FileText className="h-4 w-4" />,
      description: 'Exporter les factures',
    },
    {
      label: 'Paiements',
      endpoint: 'payments',
      icon: <Wallet className="h-4 w-4" />,
      description: 'Exporter les paiements',
    },
  ]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Exports & rapports</h3>
        <p className="text-sm text-gray-600 mt-1">
          Exportez vos données analytiques au format CSV pour les utiliser dans Excel, Google Sheets ou d'autres outils.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {exportButtons.map((button) => (
          <button
            key={button.endpoint}
            onClick={() => handleExport(button.endpoint, button.label)}
            disabled={exporting !== null}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0 p-2 rounded-md bg-blue-50 text-blue-600">
              {button.icon}
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">{button.label}</div>
              <div className="text-xs text-gray-500">{button.description}</div>
            </div>
            {exporting === button.label ? (
              <div className="flex-shrink-0 text-xs text-gray-500">Export en cours...</div>
            ) : (
              <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
