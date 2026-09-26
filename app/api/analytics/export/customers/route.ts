import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { csvResponse, formatDateForCsv, escapeCsv } from '@/lib/csv'

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

    // Fetch all customers for the store
    const customers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        sales: {
          where: {
            status: 'CONFIRMED',
            saleDate: {
              gte: periodInfo.startDate,
              lte: periodInfo.endDate,
            },
          },
          include: {
            items: true,
          },
        },
      },
    })

    // Calculate metrics for each customer
    const rows = customers.map((customer) => {
      const sales = customer.sales
      const salesCount = sales.length
      const productsBought = sales.reduce((sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0), 0)
      const revenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
      const averageOrderValue = salesCount > 0 ? revenue / salesCount : 0

      const salesWithDates = sales.filter(s => s.saleDate)
      const firstSaleDate = salesWithDates.length > 0
        ? formatDateForCsv(new Date(Math.min(...salesWithDates.map(s => s.saleDate.getTime()))))
        : ''
      const lastSaleDate = salesWithDates.length > 0
        ? formatDateForCsv(new Date(Math.max(...salesWithDates.map(s => s.saleDate.getTime()))))
        : ''

      return [
        escapeCsv(customer.name),
        escapeCsv(customer.phone || ''),
        escapeCsv(customer.email || ''),
        salesCount,
        productsBought,
        revenue,
        averageOrderValue,
        firstSaleDate,
        lastSaleDate,
      ]
    })

    const headers = [
      'Client',
      'Téléphone',
      'Email',
      'Nombre de ventes',
      'Quantité de produits achetés',
      'CA',
      'Panier moyen',
      'Première vente',
      'Dernière vente',
    ]

    const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

    // Generate filename based on period
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const filename = `stockly-clients-${year}-${month}.csv`

    return csvResponse(csv, filename)
  } catch (error) {
    console.error('Error exporting customers:', error)

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
      { error: 'Failed to export customers' },
      { status: 500 }
    )
  }
}
