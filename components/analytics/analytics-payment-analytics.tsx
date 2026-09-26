'use client'

import { Wallet, CreditCard, Building2, FileText, TrendingUp, CheckCircle, Clock, Calendar, User } from 'lucide-react'
import type { PaymentAnalytics } from '@/types/analytics.types'

interface AnalyticsPaymentAnalyticsProps {
  paymentAnalytics: PaymentAnalytics | null
  loading: boolean
}

export function AnalyticsPaymentAnalytics({ paymentAnalytics, loading }: AnalyticsPaymentAnalyticsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!paymentAnalytics) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Wallet className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <Building2 className="h-4 w-4" />
      case 'CHECK':
        return <FileText className="h-4 w-4" />
      default:
        return <Wallet className="h-4 w-4" />
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Espèces'
      case 'CARD':
        return 'Carte'
      case 'BANK_TRANSFER':
        return 'Virement bancaire'
      case 'CHECK':
        return 'Chèque'
      default:
        return method
    }
  }

  return (
    <div className="space-y-6">
      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Encaissements</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(paymentAnalytics.summary.totalCollected)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-600">Nombre de paiements</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(paymentAnalytics.summary.paymentCount)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-slate-600">Paiement moyen</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(paymentAnalytics.summary.averagePayment)} MAD</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-slate-600">Factures payées</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(paymentAnalytics.summary.paidInvoices)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-600">Factures partiellement payées</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(paymentAnalytics.summary.partiallyPaidInvoices)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Factures impayées</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatNumber(paymentAnalytics.summary.unpaidInvoices)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-600">Montant restant à encaisser (état actuel)</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(paymentAnalytics.summary.outstandingAmount)} MAD</p>
        </div>
      </div>

      {/* Section 2: Payment Methods */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Répartition des encaissements</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paymentAnalytics.methods.map((method) => (
            <div key={method.method} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getMethodIcon(method.method)}
                <span className="text-sm font-medium text-slate-700">{getMethodLabel(method.method)}</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(method.amount)} MAD</p>
              <p className="text-xs text-slate-500">{formatNumber(method.paymentCount)} paiements</p>
              <p className="text-xs text-slate-500">{method.percentage.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Current Invoice Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">État actuel des factures</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(paymentAnalytics.summary.paidInvoices)}</p>
              <p className="text-xs text-slate-500">Payées</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(paymentAnalytics.summary.partiallyPaidInvoices)}</p>
              <p className="text-xs text-slate-500">Partiellement payées</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatNumber(paymentAnalytics.summary.unpaidInvoices)}</p>
              <p className="text-xs text-slate-500">Impayées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Top Customers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Clients ayant généré des encaissements</h3>
        {paymentAnalytics.topCustomers.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucun encaissement sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Client</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Paiements</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant encaissé</th>
                </tr>
              </thead>
              <tbody>
                {paymentAnalytics.topCustomers.map((customer) => (
                  <tr key={customer.customerId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {customer.name}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right">{formatNumber(customer.paymentCount)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(customer.collectedAmount)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5: Recent Payments */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Derniers paiements</h3>
        {paymentAnalytics.recentPayments.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400">
            <p>Aucun paiement sur cette période</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Client</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Facture</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-slate-600">Méthode</th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-slate-600">Montant</th>
                </tr>
              </thead>
              <tbody>
                {paymentAnalytics.recentPayments.map((payment) => (
                  <tr key={payment.paymentId} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 px-2 text-sm text-slate-600">{formatDate(payment.paymentDate)}</td>
                    <td className="py-3 px-2 text-sm text-slate-900">{payment.customerName}</td>
                    <td className="py-3 px-2 text-sm text-slate-600">{payment.invoiceReference}</td>
                    <td className="py-3 px-2 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        {getMethodLabel(payment.method)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-slate-900 text-right font-medium">{formatCurrency(payment.amount)} MAD</td>
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
