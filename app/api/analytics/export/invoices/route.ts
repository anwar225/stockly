import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { csvResponse, formatDateForCsv, formatInvoiceStatusForCsv, escapeCsv } from '@/lib/csv'
import { requireRole } from '@/lib/auth-helpers'
import { handleAuthError } from '@/lib/auth-helpers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get period info
    const periodInfo = getPeriodInfo(period || undefined, startDate || undefined, endDate || undefined)

    // Vérifier les permissions : OWNER, ADMIN, MANAGER
    const { store } = await requireRole(['OWNER', 'ADMIN', 'MANAGER'])

    // Fetch all invoices for the store in the period
    const invoices = await prisma.invoice.findMany({
      where: {
        storeId: store.id,
        invoiceDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
        payments: true,
      },
      orderBy: [
        { invoiceDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Calculate payment totals for each invoice
    const invoicePaymentMap = new Map<string, number>()
    invoices.forEach((invoice) => {
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      invoicePaymentMap.set(invoice.id, totalPaid)
    })

    // Generate rows
    const rows = invoices.map((invoice) => {
      const totalAmount = Number(invoice.totalAmount)
      const totalPaid = invoicePaymentMap.get(invoice.id) || 0
      const remaining = totalAmount - totalPaid

      return [
        escapeCsv(invoice.reference),
        formatDateForCsv(invoice.invoiceDate),
        invoice.dueDate ? formatDateForCsv(invoice.dueDate) : '',
        escapeCsv(invoice.sale.customer.name),
        escapeCsv(invoice.sale.reference),
        totalAmount,
        totalPaid,
        remaining,
        formatInvoiceStatusForCsv(invoice.status),
      ]
    })

    const headers = [
      'Référence',
      'Date',
      'Échéance',
      'Client',
      'Vente',
      'Montant',
      'Montant encaissé',
      'Reste à encaisser',
      'Statut',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename based on period
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = `stockly-factures-${year}-${month}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error exporting invoices:', error)

    if (error instanceof Error) {
      if (error.message === 'Dates invalides') {
        return NextResponse.json(
          { error: 'Dates invalides' },
          { status: 400 }
        )
      }

      if (error.message === 'La date de début doit être antérieure à la date de fin') {
        return NextResponse.json(
          { error: 'La date de début doit être antérieure à la date de fin' },
          { status: 400 }
        )
      }

      if (error.message === 'Les paramètres startDate et endDate doivent être fournis ensemble') {
        return NextResponse.json(
          { error: 'Les paramètres startDate et endDate doivent être fournis ensemble' },
          { status: 400 }
        )
      }

      if (error.message === 'Période invalide') {
        return NextResponse.json(
          { error: 'Période invalide' },
          { status: 400 }
        )
      }

      if (error.message === 'Ne pouvez pas spécifier à la fois une période et des dates personnalisées') {
        return NextResponse.json(
          { error: 'Ne pouvez pas spécifier à la fois une période et des dates personnalisées' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to export invoices' },
      { status: 500 }
    )
  }
}
