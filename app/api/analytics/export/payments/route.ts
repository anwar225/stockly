import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { csvResponse, formatDateForCsv, formatPaymentMethodForCsv, escapeCsv } from '@/lib/csv'
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

    // Fetch payments for the period
    const payments = await prisma.payment.findMany({
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      include: {
        invoice: {
          include: {
            sale: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
      orderBy: [
        { paymentDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Build CSV rows
    const rows = payments.map((payment) => [
      escapeCsv(payment.reference || ''),
      formatDateForCsv(payment.paymentDate),
      escapeCsv(payment.invoice.reference),
      escapeCsv(payment.invoice.sale.customer.name),
      formatPaymentMethodForCsv(payment.method),
      Number(payment.amount),
      escapeCsv(payment.externalReference || ''),
      escapeCsv(payment.notes || ''),
    ])

    const headers = [
      'Référence',
      'Date',
      'Facture',
      'Client',
      'Méthode',
      'Montant',
      'Référence externe',
      'Notes',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename based on period
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = `stockly-paiements-${year}-${month}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    // Gestion centralisée des erreurs d'authentification
    const authError = handleAuthError(error as Error)
    if (authError.status !== 500) {
      return authError
    }

    console.error('Error exporting payments:', error)

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
      { error: 'Failed to export payments' },
      { status: 500 }
    )
  }
}
