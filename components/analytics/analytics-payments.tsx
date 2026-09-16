'use client'

import { Wallet, FileText, CheckCircle, Clock } from 'lucide-react'
import type { InvoicesAnalytics, PaymentsAnalytics } from '@/types/analytics.types'

interface AnalyticsPaymentsProps {
  invoices: InvoicesAnalytics | null
  payments: PaymentsAnalytics | null
  loading: boolean
}

export function AnalyticsPayments({ invoices, payments, loading }: AnalyticsPaymentsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!invoices || !payments) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Situation des factures</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Wallet className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(payments.collectedAmount)} MAD</p>
            <p className="text-xs text-slate-500">Encaissé (période)</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(invoices.outstanding)} MAD</p>
            <p className="text-xs text-slate-500">Impayé actuel</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{invoices.unpaid}</p>
            <p className="text-xs text-slate-500">Non payées</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
          <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{invoices.partiallyPaid}</p>
            <p className="text-xs text-slate-500">Partiellement payées</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg sm:col-span-2">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{invoices.paid}</p>
            <p className="text-xs text-slate-500">Payées</p>
          </div>
        </div>
      </div>
    </div>
  )
}
