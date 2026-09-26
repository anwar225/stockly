import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { csvResponse, formatDateForCsv, formatPaymentMethodForCsv, escapeCsv } from '@/lib/csv'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get period info
    const periodInfo = getPeriodInfo(period || undefined, startDate || undefined, endDate || undefined)

    // Get the first available store
    const store = await prisma.store.findFirst()
    if (!store) {
      return NextResponse.json(
        { error: 'Aucun magasin disponible' },
        { status: 500 }
      )
    }

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

    // Generate rows
    const rows = payments.map((payment) => {
      return [
        formatDateForCsv(payment.paymentDate),
        escapeCsv(payment.reference),
        escapeCsv(payment.invoice.reference),
        escapeCsv(payment.invoice.sale.customer.name),
        formatPaymentMethodForCsv(payment.method),
        Number(payment.amount),
        escapeCsv(payment.externalReference || ''),
        escapeCsv(payment.notes || ''),
      ]
    })

    const headers = [
      'Date',
      'Référence paiement',
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
