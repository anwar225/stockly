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

    // Get all customers for this store
    const customers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
      },
    })

    const totalCustomers = customers.length

    // Calculate sales analytics (CONFIRMED only)
    const salesData = await prisma.sale.groupBy({
      by: ['customerId'],
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
      _count: {
        id: true,
      },
    })

    const salesMap = new Map(
      salesData.map((data) => [
        data.customerId,
        {
          revenue: Number(data._sum.totalAmount || 0),
          salesCount: data._count.id,
        },
      ])
    )

    // Calculate products bought for each customer by aggregating SaleItem directly
    const productsBoughtData = await prisma.saleItem.groupBy({
      by: ['saleId'],
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

    // Create saleId to productsBought map
    const saleProductsMap = new Map(
      productsBoughtData.map((data) => [
        data.saleId,
        data._sum.quantity || 0,
      ])
    )

    // Get sales with customer info to map to products bought
    const salesInPeriod = await prisma.sale.findMany({
      where: {
        storeId: store.id,
        status: 'CONFIRMED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      select: {
        id: true,
        customerId: true,
      },
    })

    // Calculate products bought per customer
    const customerProductsMap = new Map<string, number>()
    for (const sale of salesInPeriod) {
      const productsBought = saleProductsMap.get(sale.id) || 0
      const current = customerProductsMap.get(sale.customerId) || 0
      customerProductsMap.set(sale.customerId, current + productsBought)
    }

    // Get first and last sale dates for each customer in period
    const salesByCustomer = await prisma.sale.findMany({
      where: {
        storeId: store.id,
        status: 'CONFIRMED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      orderBy: {
        saleDate: 'asc',
      },
      select: {
        customerId: true,
        saleDate: true,
      },
    })

    const firstSaleDateMap = new Map<string, Date>()
    const lastSaleDateMap = new Map<string, Date>()

    for (const sale of salesByCustomer) {
      if (!firstSaleDateMap.has(sale.customerId)) {
        firstSaleDateMap.set(sale.customerId, sale.saleDate)
      }
      lastSaleDateMap.set(sale.customerId, sale.saleDate)
    }

    // Build customer analytics details
    const customerDetails: any[] = []

    let totalRevenue = 0
    let totalSales = 0
    let customersWithSales = 0

    for (const customer of customers) {
      const sales = salesMap.get(customer.id) || { revenue: 0, salesCount: 0 }
      const productsBought = customerProductsMap.get(customer.id) || 0
      const firstSaleDate = firstSaleDateMap.get(customer.id) || null
      const lastSaleDate = lastSaleDateMap.get(customer.id) || null

      const averageOrderValue = sales.salesCount > 0 ? sales.revenue / sales.salesCount : 0

      if (sales.salesCount > 0) {
        customersWithSales++
      }

      totalRevenue += sales.revenue
      totalSales += sales.salesCount

      customerDetails.push({
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        salesCount: sales.salesCount,
        revenue: sales.revenue,
        productsBought,
        averageOrderValue,
        firstSaleDate: firstSaleDate ? firstSaleDate.toISOString() : null,
        lastSaleDate: lastSaleDate ? lastSaleDate.toISOString() : null,
      })
    }

    const activeCustomers = customersWithSales
    const averageCustomerRevenue = customersWithSales > 0 ? totalRevenue / customersWithSales : 0

    // Top customers (by revenue DESC, then salesCount DESC, then name ASC) - limit to 10
    const topCustomers = [...customerDetails]
      .filter((c) => c.salesCount > 0)
      .sort((a, b) => {
        if (b.revenue !== a.revenue) {
          return b.revenue - a.revenue
        }
        if (b.salesCount !== a.salesCount) {
          return b.salesCount - a.salesCount
        }
        return a.name.localeCompare(b.name)
      })
      .slice(0, 10)

    // Customers without sales in period
    const customersWithoutSales = customerDetails
      .filter((c) => c.salesCount === 0)
      .sort((a, b) => a.name.localeCompare(b.name))

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
      },
      summary: {
        totalCustomers,
        activeCustomers,
        customersWithSales,
        totalRevenue,
        totalSales,
        averageCustomerRevenue,
      },
      topCustomers,
      customersWithoutSales,
      customers: customerDetails,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching customer analytics:', error)

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
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    )
  }
}
