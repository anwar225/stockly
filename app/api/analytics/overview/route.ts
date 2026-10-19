import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'
import { getCurrentStore } from '@/lib/get-current-store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get period info
    const periodInfo = getPeriodInfo(period || undefined, startDate || undefined, endDate || undefined)

    const store = await getCurrentStore()

    // Calculate sales KPIs
    const salesCount = await prisma.sale.count({
      where: {
        storeId: store.id,
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const confirmedSalesCount = await prisma.sale.count({
      where: {
        storeId: store.id,
        status: 'CONFIRMED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const cancelledSalesCount = await prisma.sale.count({
      where: {
        storeId: store.id,
        status: 'CANCELLED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const draftSalesCount = await prisma.sale.count({
      where: {
        storeId: store.id,
        status: 'DRAFT',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const revenueResult = await prisma.sale.aggregate({
      where: {
        storeId: store.id,
        status: 'CONFIRMED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    const revenue = Number(revenueResult._sum.totalAmount || 0)

    // Calculate products sold
    const productsSoldResult = await prisma.saleItem.aggregate({
      where: {
        sale: {
          storeId: store.id,
          status: 'CONFIRMED',
          saleDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    })

    const productsSold = productsSoldResult._sum.quantity || 0

    const averageBasket = confirmedSalesCount > 0 ? revenue / confirmedSalesCount : 0

    // Calculate payments KPIs
    const collectedAmountResult = await prisma.payment.aggregate({
      where: {
        storeId: store.id,
        paymentDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const collectedAmount = Number(collectedAmountResult._sum.amount || 0)

    // Calculate invoice KPIs (current state, not period-based)
    const unpaidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'UNPAID',
      },
    })

    const partiallyPaidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'PARTIALLY_PAID',
      },
    })

    const paidInvoices = await prisma.invoice.count({
      where: {
        storeId: store.id,
        status: 'PAID',
      },
    })

    // Calculate outstanding amount
    const invoices = await prisma.invoice.findMany({
      where: {
        storeId: store.id,
        status: {
          in: ['UNPAID', 'PARTIALLY_PAID'],
        },
      },
      include: {
        payments: true,
      },
    })

    let outstanding = 0
    for (const invoice of invoices) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      outstanding += Number(invoice.totalAmount) - totalPaid
    }

    // Calculate stock KPIs (current state, not period-based)
    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
      },
    })

    const totalStock = products.reduce((sum, p) => sum + p.stock, 0)

    const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length

    const outOfStockProducts = products.filter((p) => p.stock === 0).length

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
      },
      sales: {
        count: salesCount,
        confirmedSalesCount: confirmedSalesCount,
        cancelledCount: cancelledSalesCount,
        draftCount: draftSalesCount,
        revenue,
        productsSold,
        averageBasket,
      },
      payments: {
        collectedAmount,
      },
      invoices: {
        unpaid: unpaidInvoices,
        partiallyPaid: partiallyPaidInvoices,
        paid: paidInvoices,
        outstanding,
      },
      stock: {
        total: totalStock,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHENTICATED') {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        )
      }
      if (error.message === 'NO_STORE_FOUND') {
        return NextResponse.json(
          { error: 'Aucun magasin disponible pour cette organisation' },
          { status: 500 }
        )
      }
    }
    console.error('Error fetching analytics overview:', error)

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
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
