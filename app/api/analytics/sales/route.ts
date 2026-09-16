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

    // Calculate summary KPIs
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

    // Calculate timeline data
    let timeline: Array<{
      date: string
      salesCount: number
      revenue: number
      productsSold: number
    }> = []

    if (periodInfo.granularity === 'day') {
      // Group by day using Prisma queries instead of raw SQL
      const salesInPeriod = await prisma.sale.findMany({
        where: {
          storeId: store.id,
          status: 'CONFIRMED',
          saleDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        include: {
          items: true,
        },
      })

      // Group by date
      const dateMap = new Map<string, { salesCount: number; revenue: number; productsSold: number }>()
      for (const sale of salesInPeriod) {
        const dateStr = sale.saleDate.toISOString().split('T')[0]
        const existing = dateMap.get(dateStr) || { salesCount: 0, revenue: 0, productsSold: 0 }
        const productsSold = sale.items.reduce((sum, item) => sum + item.quantity, 0)
        dateMap.set(dateStr, {
          salesCount: existing.salesCount + 1,
          revenue: existing.revenue + Number(sale.totalAmount),
          productsSold: existing.productsSold + productsSold,
        })
      }

      // Fill missing days with zeros
      const currentDate = new Date(periodInfo.startDate)
      const endDate = new Date(periodInfo.endDate)
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const data = dateMap.get(dateStr) || { salesCount: 0, revenue: 0, productsSold: 0 }
        timeline.push({
          date: dateStr,
          ...data,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // Group by month using Prisma queries
      const salesInPeriod = await prisma.sale.findMany({
        where: {
          storeId: store.id,
          status: 'CONFIRMED',
          saleDate: {
            gte: periodInfo.startDate,
            lte: periodInfo.endDate,
          },
        },
        include: {
          items: true,
        },
      })

      // Group by month
      const monthMap = new Map<string, { salesCount: number; revenue: number; productsSold: number }>()
      for (const sale of salesInPeriod) {
        const monthStr = sale.saleDate.toISOString().substring(0, 7) // YYYY-MM
        const existing = monthMap.get(monthStr) || { salesCount: 0, revenue: 0, productsSold: 0 }
        const productsSold = sale.items.reduce((sum, item) => sum + item.quantity, 0)
        monthMap.set(monthStr, {
          salesCount: existing.salesCount + 1,
          revenue: existing.revenue + Number(sale.totalAmount),
          productsSold: existing.productsSold + productsSold,
        })
      }

      timeline = Array.from(monthMap.entries())
        .map(([date, data]) => ({
          date: date + '-01',
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
    }

    // Calculate top products
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
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
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    })

    const productIds = topProducts.map((p) => p.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
      },
      include: {
        category: true,
      },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    const topProductsData = topProducts.map((item) => {
      const product = productMap.get(item.productId)
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        categoryId: product?.categoryId || null,
        categoryName: product?.category?.name || null,
        quantitySold: item._sum.quantity || 0,
        revenue: Number(item._sum.total || 0),
      }
    })

    // Sort by quantitySold DESC, then revenue DESC
    topProductsData.sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) {
        return b.quantitySold - a.quantitySold
      }
      return b.revenue - a.revenue
    })

    // Calculate categories
    const categorySales = await prisma.saleItem.groupBy({
      by: ['productId'],
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
        total: true,
      },
    })

    const allProductIds = categorySales.map((c) => c.productId)
    const allProducts = await prisma.product.findMany({
      where: {
        id: { in: allProductIds },
        storeId: store.id,
      },
      include: {
        category: true,
      },
    })

    const categoryMap = new Map<string, { quantitySold: number; revenue: number }>()
    for (const item of categorySales) {
      const product = allProducts.find((p) => p.id === item.productId)
      if (product && product.category) {
        const existing = categoryMap.get(product.category.id) || { quantitySold: 0, revenue: 0 }
        categoryMap.set(product.category.id, {
          quantitySold: existing.quantitySold + (item._sum.quantity || 0),
          revenue: existing.revenue + Number(item._sum.total || 0),
        })
      }
    }

    const categoriesData = Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const category = allProducts.find((p) => p.categoryId === categoryId)?.category
      return {
        categoryId,
        categoryName: category?.name || 'Unknown',
        quantitySold: data.quantitySold,
        revenue: data.revenue,
      }
    })

    categoriesData.sort((a, b) => b.revenue - a.revenue)

    // Calculate top customers
    const topCustomers = await prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        storeId: store.id,
        status: 'CONFIRMED',
        saleDate: {
          gte: periodInfo.startDate,
          lte: periodInfo.endDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 5,
    })

    const customerIds = topCustomers.map((c) => c.customerId)
    const customers = await prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        storeId: store.id,
      },
    })

    const customerMap = new Map(customers.map((c) => [c.id, c]))

    const topCustomersData = topCustomers.map((item) => {
      const customer = customerMap.get(item.customerId)
      return {
        customerId: item.customerId,
        customerName: customer?.name || 'Unknown',
        salesCount: item._count.id,
        revenue: Number(item._sum.totalAmount || 0),
      }
    })

    const response = {
      period: {
        type: periodInfo.type,
        startDate: periodInfo.startDate.toISOString(),
        endDate: periodInfo.endDate.toISOString(),
        granularity: periodInfo.granularity,
      },
      summary: {
        confirmedSalesCount,
        revenue,
        productsSold,
        averageBasket,
      },
      timeline,
      topProducts: topProductsData,
      categories: categoriesData,
      topCustomers: topCustomersData,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching analytics sales:', error)

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
      { error: 'Failed to fetch analytics sales' },
      { status: 500 }
    )
  }
}
