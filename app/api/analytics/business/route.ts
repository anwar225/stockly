import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodInfo } from '@/lib/analytics-helper'

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

    // Calculate sales KPIs (CONFIRMED only)
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

    // Calculate purchases KPIs (ORDERED vs RECEIVED)
    const orderedPurchases = await prisma.purchase.count({
      where: {
        storeId: store.id,
        status: 'ORDERED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const receivedPurchases = await prisma.purchase.count({
      where: {
        storeId: store.id,
        status: 'RECEIVED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
    })

    const orderedAmountResult = await prisma.purchase.aggregate({
      where: {
        storeId: store.id,
        status: 'ORDERED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    const orderedAmount = Number(orderedAmountResult._sum.totalAmount || 0)

    const receivedAmountResult = await prisma.purchase.aggregate({
      where: {
        storeId: store.id,
        status: 'RECEIVED',
        purchaseDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    })

    const receivedAmount = Number(receivedAmountResult._sum.totalAmount || 0)

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

    // Calculate outstanding amount (current state, not period-based)
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

    let outstandingAmount = 0
    for (const invoice of invoices) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      outstandingAmount += Number(invoice.totalAmount) - totalPaid
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

    // Calculate activity KPIs (current state, not period-based)
    const customers = await prisma.customer.count({
      where: {
        storeId: store.id,
      },
    })

    const suppliers = await prisma.supplier.count({
      where: {
        storeId: store.id,
      },
    })

    const activeProducts = products.length

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
      },
      sales: {
        revenue,
        confirmedSales: confirmedSalesCount,
        productsSold,
        averageBasket,
      },
      purchases: {
        receivedAmount,
        orderedAmount,
        receivedPurchases,
        orderedPurchases,
      },
      payments: {
        collectedAmount,
        outstandingAmount,
      },
      stock: {
        totalStock,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
      activity: {
        customers,
        suppliers,
        products: activeProducts,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching business analytics:', error)

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
      { error: 'Failed to fetch business analytics' },
      { status: 500 }
    )
  }
}
